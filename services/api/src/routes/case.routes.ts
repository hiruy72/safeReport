import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { getCaseById } from "../services/case.service";
import { getChatMessages, sendChatMessage, fulfillInfoRequest } from "../services/chat.service";
import { uploadEvidence, getEvidenceForCase, downloadEvidenceFile } from "../services/evidence.service";
import { generateCaseSummary } from "../services/summary.service";
import { getWitnessSubmissionsForCase, downloadWitnessAudio } from "../services/witness.service";
import { getAbuserPhoto } from "../services/abuser.service";
import { authenticate, requireActive, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(authenticate, requireActive);

router.get("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const caseRecord = await getCaseById(req.params.id, req.user!.sub, req.user!.role as never);
    res.json({ success: true, data: caseRecord });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/chat", async (req: AuthenticatedRequest, res, next) => {
  try {
    const messages = await getChatMessages(req.params.id, req.user!.sub, req.user!.role as never);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/chat", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const message = await sendChatMessage({
      caseId: req.params.id,
      senderUserId: req.user!.sub,
      senderRole: req.user!.role as never,
      content,
    });
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/evidence", async (req: AuthenticatedRequest, res, next) => {
  try {
    const evidence = await getEvidenceForCase(req.params.id, req.user!.sub, req.user!.role);
    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

router.patch("/:caseId/info-requests/:requestId/fulfill", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await fulfillInfoRequest(req.params.requestId, req.user!.sub);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/summary", async (req: AuthenticatedRequest, res, next) => {
  try {
    const summary = await generateCaseSummary(req.params.id, req.user!.sub, req.user!.role as never);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/witness", async (req: AuthenticatedRequest, res, next) => {
  try {
    const items = await getWitnessSubmissionsForCase(req.params.id, req.user!.sub, req.user!.role as never);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/witness/:submissionId/audio", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { buffer, mime, fileName } = await downloadWitnessAudio(
      req.params.submissionId,
      req.user!.sub,
      req.user!.role as never,
    );
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/abuser-photo", async (req: AuthenticatedRequest, res, next) => {
  try {
    const caseRecord = await getCaseById(req.params.id, req.user!.sub, req.user!.role as never);
    const { buffer, mime, fileName } = await getAbuserPhoto(
      caseRecord.reportId,
      req.user!.sub,
      req.user!.role as never,
    );
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;

const evidenceRouter = Router();
evidenceRouter.use(authenticate, requireActive);

evidenceRouter.post("/upload", upload.single("file"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { reportId } = z.object({ reportId: z.string() }).parse(req.body);
    if (!req.file) throw new Error("No file uploaded");
    const evidence = await uploadEvidence({
      reportId,
      userId: req.user!.sub,
      role: req.user!.role as never,
      file: req.file,
    });
    res.status(201).json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

evidenceRouter.get("/:id/file", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { buffer, evidence } = await downloadEvidenceFile(
      req.params.id,
      req.user!.sub,
      req.user!.role,
    );
    res.setHeader("Content-Type", evidence.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${evidence.fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export { evidenceRouter };
