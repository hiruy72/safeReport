import {
  prisma,
  Gender,
  IdentityVerificationStatus,
  CaseStatus,
  CasePriority,
  ReportCategory,
  AbuserRelationship,
} from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { encryptPayload, hashNationalId } from "../utils/crypto";
import { generateAnonymousId, generateCaseNumber, ageRangeFromDob } from "../utils/ids";
import { createNotification } from "./notification.service";
import { notifyStationOfficers } from "./identity.service";
import { findNearestStation } from "../utils/geo";

export async function registerVictim(input: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  password: string;
  nationalIdNumber: string;
  address: string;
  regionId: string;
  cityId?: string;
}) {
  const idHash = hashNationalId(input.nationalIdNumber);
  const existingId = await prisma.identityVault.findUnique({ where: { nationalIdHash: idHash } });
  if (existingId) throw new AppError(409, "National ID already registered");

  const anonymousId = generateAnonymousId();
  const dob = new Date(input.dateOfBirth);
  const ageRange = ageRangeFromDob(dob);

  const encryptedPayload = encryptPayload({
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    phone: input.phone,
    nationalIdNumber: input.nationalIdNumber,
    address: input.address,
  });

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      role: "VICTIM",
      status: "ACTIVE",
      victimProfile: {
        create: {
          anonymousId,
          ageRange,
          gender: input.gender,
          regionId: input.regionId,
          cityId: input.cityId,
          verificationStatus: IdentityVerificationStatus.PENDING,
          identityVault: {
            create: {
              encryptedPayload,
              nationalIdHash: idHash,
            },
          },
        },
      },
    },
    include: { victimProfile: true },
  });

  return {
    id: user.id,
    email: user.email,
    anonymousId: user.victimProfile!.anonymousId,
    verificationStatus: user.victimProfile!.verificationStatus,
  };
}

export async function verifyVictimIdentity(victimProfileId: string, approved: boolean) {
  const profile = await prisma.victimProfile.update({
    where: { id: victimProfileId },
    data: {
      verificationStatus: approved
        ? IdentityVerificationStatus.VERIFIED
        : IdentityVerificationStatus.REJECTED,
      verifiedAt: approved ? new Date() : null,
    },
    include: { user: true },
  });

  if (approved) {
    await createNotification({
      userId: profile.userId,
      title: "Identity Verified",
      body: "Your identity has been verified. You can now submit reports.",
    });
  }

  return profile;
}

export async function submitReport(
  userId: string,
  input: {
    category: ReportCategory;
    incidentDate: string;
    incidentTime?: string;
    location: string;
    description: string;
    abuserKnown: boolean;
    abuserName?: string;
    abuserNickname?: string;
    abuserPhone?: string;
    abuserSocial?: string;
    abuserWorkplace?: string;
    abuserSchool?: string;
    abuserVehicle?: string;
    abuserAddress?: string;
    abuserRelation?: AbuserRelationship;
  },
  coords?: { latitude?: number; longitude?: number },
) {
  const victim = await prisma.victimProfile.findUnique({ where: { userId } });
  if (!victim) throw new AppError(404, "Victim profile not found");
  if (victim.verificationStatus !== IdentityVerificationStatus.VERIFIED) {
    throw new AppError(403, "Identity verification required before submitting reports");
  }

  const station = await findNearestStation(victim.regionId, coords?.latitude, coords?.longitude);
  if (!station) throw new AppError(400, "No police station available in your region");

  const caseNumber = generateCaseNumber();

  const report = await prisma.report.create({
    data: {
      victimProfileId: victim.id,
      category: input.category,
      incidentDate: new Date(input.incidentDate),
      incidentTime: input.incidentTime,
      location: input.location,
      description: input.description,
      abuserKnown: input.abuserKnown,
      abuserName: input.abuserName,
      abuserNickname: input.abuserNickname,
      abuserPhone: input.abuserPhone,
      abuserSocial: input.abuserSocial,
      abuserWorkplace: input.abuserWorkplace,
      abuserSchool: input.abuserSchool,
      abuserVehicle: input.abuserVehicle,
      abuserAddress: input.abuserAddress,
      abuserRelation: input.abuserRelation,
      case: {
        create: {
          caseNumber,
          stationId: station.id,
          status: CaseStatus.SENT_TO_POLICE,
          statusHistory: {
            create: [
              { status: CaseStatus.SUBMITTED },
              { status: CaseStatus.IDENTITY_VERIFIED },
              { status: CaseStatus.SENT_TO_POLICE },
            ],
          },
        },
      },
    },
    include: { case: true },
  });

  await createNotification({
    userId,
    title: "Report Submitted",
    body: `Your case ${caseNumber} has been sent to ${station.name}.`,
    metadata: { caseId: report.case!.id, caseNumber },
  });

  await notifyStationOfficers(
    station.id,
    "New Case Received",
    `Case ${caseNumber} requires review.`,
    { caseId: report.case!.id, caseNumber },
  );

  return report;
}

export async function getVictimCases(userId: string) {
  const victim = await prisma.victimProfile.findUnique({ where: { userId } });
  if (!victim) throw new AppError(404, "Victim profile not found");

  return prisma.report.findMany({
    where: { victimProfileId: victim.id },
    include: {
      case: {
        include: {
          statusHistory: { orderBy: { createdAt: "asc" } },
          station: { select: { name: true } },
        },
      },
      evidence: { select: { id: true, type: true, fileName: true, uploadedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVictimProfile(userId: string) {
  const victim = await prisma.victimProfile.findUnique({
    where: { userId },
    include: { region: true, city: true, identityVault: { select: { idImageKey: true, selfieImageKey: true } } },
  });
  if (!victim) throw new AppError(404, "Victim profile not found");

  return {
    anonymousId: victim.anonymousId,
    ageRange: victim.ageRange,
    gender: victim.gender,
    region: victim.region?.name,
    city: victim.city?.name,
    verificationStatus: victim.verificationStatus,
    hasIdentityDocuments: !!(victim.identityVault?.idImageKey && victim.identityVault?.selfieImageKey),
  };
}
