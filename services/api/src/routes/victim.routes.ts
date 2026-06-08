import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { Gender, ReportCategory, AbuserRelationship } from "@safeher/db";
import {
  registerVictim,
  submitReport,
  getVictimCases,
  getVictimProfile,
} from "../services/victim.service";
import { uploadVictimIdentityDocs } from "../services/identity.service";
import { uploadAbuserPhoto } from "../services/abuser.service";
import { triggerSOS } from "../services/case.service";
import {
  listEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../services/emergency-contact.service";
import { authenticate, requireActive, requireRole, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.nativeEnum(Gender),
  phone: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
  nationalIdNumber: z.string().min(5),
  address: z.string().min(1),
  regionId: z.string(),
  cityId: z.string().optional(),
});

const reportSchema = z.object({
  category: z.nativeEnum(ReportCategory),
  incidentDate: z.string(),
  incidentTime: z.string().optional(),
  location: z.string().min(1),
  description: z.string().min(10),
  abuserKnown: z.boolean(),
  abuserName: z.string().optional(),
  abuserNickname: z.string().optional(),
  abuserPhone: z.string().optional(),
  abuserSocial: z.string().optional(),
  abuserWorkplace: z.string().optional(),
  abuserSchool: z.string().optional(),
  abuserVehicle: z.string().optional(),
  abuserAddress: z.string().optional(),
  abuserRelation: z.nativeEnum(AbuserRelationship).optional(),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerVictim(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.use(authenticate, requireRole("VICTIM"), requireActive);

router.post(
  "/identity-documents",
  upload.fields([
    { name: "idImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const files = req.files as { idImage?: Express.Multer.File[]; selfieImage?: Express.Multer.File[] };
      const result = await uploadVictimIdentityDocs(req.user!.sub, {
        idImage: files.idImage?.[0],
        selfieImage: files.selfieImage?.[0],
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.get("/profile", async (req: AuthenticatedRequest, res, next) => {
  try {
    const profile = await getVictimProfile(req.user!.sub);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

router.get("/cases", async (req: AuthenticatedRequest, res, next) => {
  try {
    const cases = await getVictimCases(req.user!.sub);
    res.json({ success: true, data: cases });
  } catch (err) {
    next(err);
  }
});

router.post("/reports", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = reportSchema.parse(req.body);
    const { latitude, longitude } = z
      .object({ latitude: z.number().optional(), longitude: z.number().optional() })
      .parse(req.body);
    const report = await submitReport(req.user!.sub, body, { latitude, longitude });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/reports/:reportId/abuser-photo",
  upload.single("photo"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) throw new Error("No photo uploaded");
      const result = await uploadAbuserPhoto(req.params.reportId, req.user!.sub, req.file);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

const emergencyContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  relationship: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  notifyOnSos: z.boolean().optional(),
});

router.get("/emergency-contacts", async (req: AuthenticatedRequest, res, next) => {
  try {
    const contacts = await listEmergencyContacts(req.user!.sub);
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(err);
  }
});

router.post("/emergency-contacts", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = emergencyContactSchema.parse(req.body);
    const contact = await addEmergencyContact(req.user!.sub, body);
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
});

router.patch("/emergency-contacts/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = emergencyContactSchema.partial().parse(req.body);
    const contact = await updateEmergencyContact(req.user!.sub, req.params.id, body);
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
});

router.delete("/emergency-contacts/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await deleteEmergencyContact(req.user!.sub, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/sos", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { latitude, longitude } = z
      .object({ latitude: z.number().optional(), longitude: z.number().optional() })
      .parse(req.body);
    const result = await triggerSOS(req.user!.sub, latitude, longitude);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
