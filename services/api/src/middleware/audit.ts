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

