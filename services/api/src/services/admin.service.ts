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

// Commit: Add media sanitization on upload - 2026-06-09T21:29:14

// Commit: Add admin layout with sidebar navigation - 2026-06-12T20:59:56

// Commit: Implement audit trail viewer for admin - 2026-06-14T23:59:05

// Commit: Add region management for admin - 2026-06-16T07:08:28

// Commit: Add geolocation parsing utilities - 2026-06-18T22:47:48

// Commit: Configure Turborepo build pipeline - 2026-06-20T16:44:00

// Commit: Add admin layout with sidebar navigation - 2026-06-22T21:57:32

// Commit: Implement audit trail viewer for admin - 2026-06-24T08:03:34

// Commit: Add region management for admin - 2026-06-27T09:16:42

// Commit: Add admin layout with sidebar navigation - 2026-07-02T15:07:22

// Commit: Implement audit trail viewer for admin - 2026-07-04T18:18:32

// Commit: Add region management for admin - 2026-07-06T20:33:29

// Commit: Add media sanitization on upload - 2026-07-11T17:26:17

// Commit: Add admin layout with sidebar navigation - 2026-07-12T18:39:33

// Commit: Implement audit trail viewer for admin - 2026-07-15T11:51:49
