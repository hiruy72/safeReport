import { Router } from "express";
import { z } from "zod";
import { CaseStatus } from "@safeher/db";
import { getPoliceDashboard, getStationCases, getCaseById, updateCaseStatus, assignInvestigator } from "../services/case.service";
import { generatePoliceReport } from "../services/summary.service";
import { getSuspectMatchesForStation } from "../services/ai.service";
import { createInfoRequest, getChatMessages, sendChatMessage } from "../services/chat.service";
import { getEvidenceForCase } from "../services/evidence.service";
import { prisma } from "@safeher/db";
import { authenticate, requireActive, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const router = Router();

router.use(authenticate, requireRole("POLICE"), requireActive);

async function getOfficer(req: AuthenticatedRequest) {
  const officer = await prisma.policeProfile.findUnique({ where: { userId: req.user!.sub } });
  if (!officer?.stationId) {
    throw new AppError(403, "No police station assigned. Contact an administrator.");
  }
  return officer;
}

router.get("/dashboard", async (req: AuthenticatedRequest, res, next) => {
  try {
    const officer = await getOfficer(req);
    const stats = await getPoliceDashboard(officer.stationId!);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get("/cases", async (req: AuthenticatedRequest, res, next) => {
  try {
    const officer = await getOfficer(req);
    const status = req.query.status as CaseStatus | undefined;
    const cases = await getStationCases(officer.stationId!, status);
    res.json({ success: true, data: cases });
  } catch (err) {
    next(err);
  }
});

router.get("/cases/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const caseRecord = await getCaseById(req.params.id, req.user!.sub, "POLICE");
    res.json({ success: true, data: caseRecord });
  } catch (err) {
    next(err);
  }
});

router.patch("/cases/:id/status", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, note } = z
      .object({ status: z.nativeEnum(CaseStatus), note: z.string().optional() })
      .parse(req.body);
    const updated = await updateCaseStatus(req.params.id, req.user!.sub, status, note);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/cases/:id/evidence", async (req: AuthenticatedRequest, res, next) => {
  try {
    const evidence = await getEvidenceForCase(req.params.id, req.user!.sub, "POLICE");
    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

router.get("/cases/:id/chat", async (req: AuthenticatedRequest, res, next) => {
  try {
    const messages = await getChatMessages(req.params.id, req.user!.sub, "POLICE");
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

router.post("/cases/:id/chat", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const message = await sendChatMessage({
      caseId: req.params.id,
      senderUserId: req.user!.sub,
      senderRole: "POLICE",
      content,
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

router.post("/cases/:id/info-request", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = z.object({ type: z.string(), message: z.string().min(1) }).parse(req.body);
    const request = await createInfoRequest({
      caseId: req.params.id,
      policeUserId: req.user!.sub,
      ...body,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

router.post("/cases/:id/assign", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { investigatorId } = z.object({ investigatorId: z.string() }).parse(req.body);
    const updated = await assignInvestigator(req.params.id, investigatorId, req.user!.sub);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/officers", async (req: AuthenticatedRequest, res, next) => {
  try {
    const officer = await getOfficer(req);
    const officers = await prisma.policeProfile.findMany({
      where: { stationId: officer.stationId },
      select: { id: true, firstName: true, lastName: true, badgeNumber: true },
    });
    res.json({ success: true, data: officers });
  } catch (err) {
    next(err);
  }
});

router.get("/cases/:id/report", async (req: AuthenticatedRequest, res, next) => {
  try {
    const report = await generatePoliceReport(req.params.id, req.user!.sub);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.get("/suspect-matches", async (req: AuthenticatedRequest, res, next) => {
  try {
    const officer = await getOfficer(req);
    const matches = await getSuspectMatchesForStation(officer.stationId!);
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
});

export default router;
