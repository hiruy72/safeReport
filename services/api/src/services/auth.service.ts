import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { prisma, UserRole, UserStatus } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { signAccessToken, signRefreshToken, verifyRefreshToken, getRefreshExpiry } from "../utils/jwt";

export async function registerUser(input: {
  email: string;
  password: string;
  role: UserRole;
  profile: Record<string, unknown>;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new AppError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const status = input.role === UserRole.ADMIN ? UserStatus.ACTIVE : UserStatus.PENDING;

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      status: input.role === UserRole.VICTIM ? UserStatus.ACTIVE : status,
      ...(input.role === UserRole.POLICE && {
        policeProfile: { create: input.profile as never },
      }),
      ...(input.role === UserRole.VICTIM && {
        victimProfile: { create: input.profile as never },
      }),
    },
    include: { victimProfile: true, policeProfile: true },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { victimProfile: true, policeProfile: true, adminProfile: true },
  });

  if (!user) throw new AppError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password");

  if (user.status === UserStatus.SUSPENDED) {
    throw new AppError(403, "Account suspended");
  }

  if (user.isTwoFactorEnabled) {
    return {
      requires2FA: true,
      userId: user.id,
    };
  }

  return completeLogin(user);
}

export async function verify2FALogin(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { victimProfile: true, policeProfile: true, adminProfile: true },
  });
  
  if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError(401, "2FA is not enabled for this user");
  }

  const isValid = verifySync({ token, secret: user.twoFactorSecret }).valid;
  if (!isValid) throw new AppError(401, "Invalid 2FA code");

  return completeLogin(user);
}

async function completeLogin(user: any) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN" },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      anonymousId: user.victimProfile?.anonymousId,
      badgeNumber: user.policeProfile?.badgeNumber,
    },
  };
}

export async function setup2FA(userId: string, email: string) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: "SafeHer", label: email, secret });
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
  
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCodeUrl };
}

export async function verifyAndEnable2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new AppError(400, "2FA setup not initiated");
  }

  const isValid = verifySync({ token, secret: user.twoFactorSecret }).valid;
  if (!isValid) throw new AppError(400, "Invalid 2FA code");

  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  });

  return { success: true };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, "Refresh token expired");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError(401, "User not found");

  const newPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  return { accessToken: signAccessToken(newPayload) };
}

export async function logoutUser(refreshToken: string, userId?: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  if (userId) {
    await prisma.auditLog.create({ data: { userId, action: "LOGOUT" } });
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid current password");

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true };
}































// _rev: 639203365720000000

// Commit: Fix token expiry edge case on refresh - 2026-08-02T08:55:13

// Commit: Implement two-factor authentication - 2026-08-02T16:05:20

// Commit: Implement JWT token refresh logic - 2026-08-04T12:53:19

// Commit: Implement biometric authentication flow - 2026-08-05T07:15:24

// Commit: Fix broken navigation after auth expiry - 2026-08-05T19:29:15

// Commit: Create login and registration screens - 2026-08-07T23:27:30

// Commit: Add unit tests for auth service - 2026-08-09T20:14:26

// Commit: Add user authentication service - 2026-08-10T14:19:14

// Commit: Fix token expiry edge case on refresh - 2026-08-13T17:44:22

// Commit: Implement two-factor authentication - 2026-08-13T16:00:36

// Commit: Implement JWT token refresh logic - 2026-08-15T11:26:18

// Commit: Implement biometric authentication flow - 2026-08-16T18:46:04

// Commit: Fix broken navigation after auth expiry - 2026-08-17T16:47:42

// Commit: Create login and registration screens - 2026-08-19T23:54:42

// Commit: Add unit tests for auth service - 2026-08-20T08:48:33

// Commit: Add user authentication service - 2026-08-21T08:22:24
