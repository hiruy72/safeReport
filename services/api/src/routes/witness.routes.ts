import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { submitWitnessStatement } from "../services/witness.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/", upload.single("audio"), async (req, res, next) => {
  try {
    const body = z.object({
      caseNumber: z.string().min(3),
      statement: z.string().min(10),
    }).parse(req.body);

    const result = await submitWitnessStatement({
      caseNumber: body.caseNumber,
      statement: body.statement,
      audio: req.file,
    });
    res.status(201).json({ success: true, data: result, message: "Thank you. Your statement has been submitted anonymously." });
  } catch (err) {
    next(err);
  }
});

export default router;

// Commit: Write API documentation with Swagger - 2026-06-22T09:32:53

// Commit: Add environment variable templates - 2026-06-25T12:30:08

// Commit: Create onboarding flow for new users - 2026-07-15T09:09:16
// _rev: 639195426730000000
