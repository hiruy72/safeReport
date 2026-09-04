import { UserStatus, prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { verifyVictimIdentity } from "./victim.service";
import { createNotification } from "./notification.service";
import { notifyStationOfficers } from "./identity.service";

export async function approvePolice(userId: string, adminUserId: string, stationId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { policeProfile: true },
  });
  if (!user || !user.policeProfile) throw new AppError(404, "Police user not found");

  const resolvedStationId = stationId ?? user.policeProfile.stationId;
  if (!resolvedStationId) {
    throw new AppError(400, "A police station must be assigned before approval");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.ACTIVE,
      policeProfile: {
        update: {
          approvedAt: new Date(),
          approvedById: adminUserId,
          stationId: resolvedStationId,
        },
      },
    },
  });

  await createNotification({
    userId,
    title: "Account Approved",
    body: "Your police officer account has been approved. You can now access cases.",
  });

  return updated;
}

export async function rejectPolice(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.REJECTED },
  });
}

export async function suspendUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.SUSPENDED },
  });
}

export async function activateUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE },
  });
}

export async function getPendingPolice() {
  return prisma.user.findMany({
    where: { role: "POLICE", status: UserStatus.PENDING },
    include: { policeProfile: { include: { station: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingVictims() {
  return prisma.victimProfile.findMany({
    where: { verificationStatus: "PENDING" },
    select: {
      id: true,
      anonymousId: true,
      ageRange: true,
      gender: true,
      createdAt: true,
      region: { select: { name: true } },
      identityVault: { select: { idImageKey: true, selfieImageKey: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminStats() {
  const [users, cases, pendingPolice, pendingVictims] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.case.groupBy({ by: ["status"], _count: true }),
    prisma.user.count({ where: { role: "POLICE", status: UserStatus.PENDING } }),
    prisma.victimProfile.count({ where: { verificationStatus: "PENDING" } }),
  ]);

  return { users, cases, pendingPolice, pendingVictims };
}

export async function createRegion(name: string) {
  return prisma.region.create({ data: { name } });
}

export async function createCity(regionId: string, name: string) {
  return prisma.city.create({ data: { regionId, name } });
}

export async function createPoliceStation(input: {
  name: string;
  address: string;
  phone?: string;
  regionId: string;
  cityId?: string;
  latitude?: number;
  longitude?: number;
}) {
  return prisma.policeStation.create({ data: input });
}

export async function getRegions() {
  return prisma.region.findMany({
    include: { cities: true, policeStations: true },
    orderBy: { name: "asc" },
  });
}

export async function getAuditLogs(page = 1, pageSize = 50) {
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export { verifyVictimIdentity };















// _rev: 639204142870000000

// Commit: Add toast notification system - 2026-08-03T12:42:18

// Commit: Implement audit trail viewer for admin - 2026-08-03T08:06:14

// Commit: Implement role-based access control - 2026-08-04T11:13:13

// Commit: Add region management for admin - 2026-08-04T19:49:21

// Commit: Add media sanitization on upload - 2026-08-05T18:10:04

// Commit: Add admin layout with sidebar navigation - 2026-08-10T15:17:35

// Commit: Implement audit trail viewer for admin - 2026-08-14T12:14:47

// Commit: Add region management for admin - 2026-08-15T19:44:01

// Commit: Fix pagination off-by-one error - 2026-08-17T11:58:57

// Commit: Add admin layout with sidebar navigation - 2026-08-21T07:08:26

// Commit: Implement audit trail viewer for admin - 2026-08-24T09:40:10

// Commit: Add region management for admin - 2026-08-25T13:59:30

// Commit: Add victim profile management page - 2026-08-29T10:44:44

// Commit: Add shared TypeScript types package - 2026-08-31T12:29:46

// Commit: Add admin layout with sidebar navigation - 2026-08-31T10:29:07

// Commit: Implement audit trail viewer for admin - 2026-09-04T15:57:15

// Commit: Add region management for admin - 2026-09-04T20:32:41
