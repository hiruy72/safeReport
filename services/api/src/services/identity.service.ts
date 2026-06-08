import { prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { decryptPayload } from "../utils/crypto";
import { saveEncryptedFile, readEncryptedFile, fileExists, deleteFile } from "../utils/file-storage";
import { createNotification } from "./notification.service";

export async function uploadVictimIdentityDocs(
  userId: string,
  files: { idImage?: Express.Multer.File; selfieImage?: Express.Multer.File },
) {
  const profile = await prisma.victimProfile.findUnique({
    where: { userId },
    include: { identityVault: true },
  });
  if (!profile?.identityVault) throw new AppError(404, "Victim profile not found");
  if (!files.idImage || !files.selfieImage) {
    throw new AppError(400, "Both National ID image and selfie are required");
  }

  // Delete old files from S3 before replacing with new ones
  const oldKeys: string[] = [];
  if (profile.identityVault.idImageKey) oldKeys.push(profile.identityVault.idImageKey);
  if (profile.identityVault.selfieImageKey) oldKeys.push(profile.identityVault.selfieImageKey);

  const idImageKey = await saveEncryptedFile(files.idImage.buffer, files.idImage.originalname);
  const selfieImageKey = await saveEncryptedFile(files.selfieImage.buffer, files.selfieImage.originalname);

  await prisma.identityVault.update({
    where: { id: profile.identityVault.id },
    data: { idImageKey, selfieImageKey },
  });

  // Fire-and-forget old file cleanup after DB update succeeds
  await Promise.allSettled(oldKeys.map((k) => deleteFile(k)));

  return { idImageKey, selfieImageKey };
}

export async function uploadPoliceCredential(userId: string, file: Express.Multer.File) {
  const profile = await prisma.policeProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(404, "Police profile not found");

  const oldCredentialKey = profile.credentialKey;
  const credentialKey = await saveEncryptedFile(file.buffer, file.originalname);
  await prisma.policeProfile.update({
    where: { id: profile.id },
    data: { credentialKey },
  });
  if (oldCredentialKey) await deleteFile(oldCredentialKey);
  return { credentialKey };
}

export async function getPendingVictimVerificationDetails(profileId: string) {
  const profile = await prisma.victimProfile.findUnique({
    where: { id: profileId },
    include: { identityVault: true, region: true, city: true },
  });
  if (!profile?.identityVault) throw new AppError(404, "Victim not found");

  const identity = decryptPayload<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    nationalIdNumber: string;
    address: string;
  }>(profile.identityVault.encryptedPayload);

  await prisma.auditLog.create({
    data: { action: "VIEW_IDENTITY", resource: "victimProfile", resourceId: profileId },
  });

  return {
    profileId: profile.id,
    anonymousId: profile.anonymousId,
    ageRange: profile.ageRange,
    gender: profile.gender,
    region: profile.region?.name,
    city: profile.city?.name,
    createdAt: profile.createdAt,
    hasIdImage: !!profile.identityVault.idImageKey,
    hasSelfie: !!profile.identityVault.selfieImageKey,
    identity,
  };
}

export async function getVictimDocumentForAdmin(profileId: string, type: "id" | "selfie") {
  const profile = await prisma.victimProfile.findUnique({
    where: { id: profileId },
    include: { identityVault: true },
  });
  if (!profile?.identityVault) throw new AppError(404, "Victim not found");

  const key = type === "id" ? profile.identityVault.idImageKey : profile.identityVault.selfieImageKey;
  if (!key || !(await fileExists(key))) throw new AppError(404, "Document not uploaded");

  const buffer = await readEncryptedFile(key);
  const mime = type === "id" ? "image/jpeg" : "image/jpeg";
  return { buffer, mime, fileName: `${type}-document.jpg` };
}

export async function getPoliceCredentialForAdmin(userId: string) {
  const profile = await prisma.policeProfile.findUnique({ where: { userId } });
  if (!profile?.credentialKey || !(await fileExists(profile.credentialKey))) {
    throw new AppError(404, "Credential not uploaded");
  }
  const buffer = await readEncryptedFile(profile.credentialKey);
  return { buffer, mime: "application/pdf", fileName: "credential.pdf" };
}

export async function notifyStationOfficers(
  stationId: string,
  title: string,
  body: string,
  metadata?: Record<string, string>,
) {
  const officers = await prisma.policeProfile.findMany({
    where: { stationId },
    include: { user: { select: { id: true, status: true } } },
  });

  await Promise.all(
    officers
      .filter((o) => o.user.status === "ACTIVE")
      .map((o) =>
        createNotification({
          userId: o.user.id,
          title,
          body,
          metadata,
          sendSmsToo: true,
        }),
      ),
  );
}
