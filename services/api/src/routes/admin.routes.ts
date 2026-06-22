import { Router } from "express";
import { z } from "zod";
import {
  approvePolice,
  rejectPolice,
  suspendUser,
  getPendingPolice,
  getPendingVictims,
  getAdminStats,
  createRegion,
  createCity,
  createPoliceStation,
  getRegions,
  getAuditLogs,
  verifyVictimIdentity,
  activateUser,
} from "../services/admin.service";
import {
  getPendingVictimVerificationDetails,
  getVictimDocumentForAdmin,
  getPoliceCredentialForAdmin,
} from "../services/identity.service";
import { getAdminAnalytics } from "../services/analytics.service";
import { getGlobalSuspectMatches } from "../services/ai.service";
import { authenticate, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/stats", async (_req, res, next) => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get("/police/pending", async (_req, res, next) => {
  try {
    const pending = await getPendingPolice();
    res.json({ success: true, data: pending });
  } catch (err) {
    next(err);
  }
});

router.post("/police/:userId/approve", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { stationId } = z.object({ stationId: z.string().optional() }).parse(req.body ?? {});
    const result = await approvePolice(req.params.userId, req.user!.sub, stationId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/police/:userId/reject", async (req, res, next) => {
  try {
    const result = await rejectPolice(req.params.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/victims/pending", async (_req, res, next) => {
  try {
    const pending = await getPendingVictims();
    res.json({ success: true, data: pending });
  } catch (err) {
    next(err);
  }
});

router.post("/victims/:profileId/verify", async (req, res, next) => {
  try {
    const { approved } = z.object({ approved: z.boolean() }).parse(req.body);
    const result = await verifyVictimIdentity(req.params.profileId, approved);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/victims/:profileId/verification", async (req, res, next) => {
  try {
    const details = await getPendingVictimVerificationDetails(req.params.profileId);
    res.json({ success: true, data: details });
  } catch (err) {
    next(err);
  }
});

router.get("/victims/:profileId/documents/:type", async (req, res, next) => {
  try {
    const type = req.params.type === "selfie" ? "selfie" : "id";
    const { buffer, mime, fileName } = await getVictimDocumentForAdmin(req.params.profileId, type);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get("/police/:userId/credential", async (req, res, next) => {
  try {
    const { buffer, mime, fileName } = await getPoliceCredentialForAdmin(req.params.userId);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.post("/users/:userId/suspend", async (req, res, next) => {
  try {
    const result = await suspendUser(req.params.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:userId/activate", async (req, res, next) => {
  try {
    const result = await activateUser(req.params.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/regions", async (_req, res, next) => {
  try {
    const regions = await getRegions();
    res.json({ success: true, data: regions });
  } catch (err) {
    next(err);
  }
});

router.post("/regions", async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const region = await createRegion(name);
    res.status(201).json({ success: true, data: region });
  } catch (err) {
    next(err);
  }
});

router.post("/cities", async (req, res, next) => {
  try {
    const body = z.object({ regionId: z.string(), name: z.string().min(1) }).parse(req.body);
    const city = await createCity(body.regionId, body.name);
    res.status(201).json({ success: true, data: city });
  } catch (err) {
    next(err);
  }
});

router.post("/stations", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(1),
        address: z.string().min(1),
        phone: z.string().optional(),
        regionId: z.string(),
        cityId: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .parse(req.body);
    const station = await createPoliceStation(body);
    res.status(201).json({ success: true, data: station });
  } catch (err) {
    next(err);
  }
});

router.get("/analytics", async (_req, res, next) => {
  try {
    const data = await getAdminAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/ai/suspect-matches", async (_req, res, next) => {
  try {
    const matches = await getGlobalSuspectMatches();
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const logs = await getAuditLogs(page);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

export default router;

