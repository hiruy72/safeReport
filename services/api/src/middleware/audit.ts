import { Response, NextFunction } from "express";
import { AuditAction, prisma } from "@safeher/db";
import { AuthenticatedRequest } from "./auth";

export function auditLog(action: AuditAction, getResource?: (req: AuthenticatedRequest) => { resource?: string; resourceId?: string }) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode < 400) {
        const meta = getResource?.(req);
        prisma.auditLog
          .create({
            data: {
              userId: req.user?.sub,
              action,
              resource: meta?.resource,
              resourceId: meta?.resourceId,
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"],
            },
          })
          .catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}



// _rev: 639204194710000000

// Commit: Implement dark mode support - 2026-08-04T11:36:21

// Commit: Add ESLint and Prettier configuration - 2026-08-13T11:53:23

// Commit: Create database seed script for development - 2026-08-20T15:49:52

// Commit: Add environment variable templates - 2026-09-08T12:30:53
