import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthUser } from "@safeher/shared-types";

export interface TokenPayload {
  sub: string;
  email: string;
  role: AuthUser["role"];
  status: AuthUser["status"];
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
}

export function getRefreshExpiry(): Date {
  const days = parseInt(env.jwt.refreshExpiresIn.replace("d", ""), 10) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}


// _rev: 639200490000000000

// Commit: Add multi-language support scaffold - 2026-08-02T16:47:11

// Commit: Add file upload service with S3 integration - 2026-08-07T22:46:31

// Commit: Add error boundary and global error handler - 2026-09-08T23:26:04

// Commit: Implement chat between victim and officer - 2026-09-13T15:23:29
