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

