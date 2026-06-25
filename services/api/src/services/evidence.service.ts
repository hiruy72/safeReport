import { EvidenceType, prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { hashFile } from "../utils/crypto";
import { saveEncryptedFile, readEncryptedFile, fileExists } from "../utils/file-storage";
import { sanitizeFileBuffer } from "../utils/image-sanitize";
import path from "path";

function mapMimeToType(mime: string): EvidenceType {
  if (mime.startsWith("image/")) return mime.includes("screenshot") ? EvidenceType.SCREENSHOT : EvidenceType.IMAGE;
  if (mime.startsWith("video/")) return EvidenceType.VIDEO;
  if (mime.startsWith("audio/")) return EvidenceType.AUDIO;
  if (mime === "application/pdf") return EvidenceType.PDF;
  return EvidenceType.DOCUMENT;
}

export async function uploadEvidence(input: {
  reportId: string;
  userId: string;
  role: string;
  file: Express.Multer.File;
}) {
  const report = await prisma.report.findUnique({
    where: { id: input.reportId },
    include: { victimProfile: true, case: true },
  });
  if (!report) throw new AppError(404, "Report not found");
  
  if (input.role === "VICTIM" && report.victimProfile.userId !== input.userId) {
    throw new AppError(403, "Access denied");
  }

  if (input.role === "POLICE") {
    const officer = await prisma.policeProfile.findUnique({ where: { userId: input.userId } });
    if (!officer || (report.case && officer.stationId !== report.case.stationId)) {
      throw new AppError(403, "Access denied");
    }
  }

  const sanitized = await sanitizeFileBuffer(input.file.buffer, input.file.mimetype);
  const fileHash = hashFile(sanitized);
  const fileKey = await saveEncryptedFile(sanitized, input.file.originalname);

  return prisma.evidence.create({
    data: {
      reportId: input.reportId,
      type: mapMimeToType(input.file.mimetype),
      fileName: input.file.originalname,
      fileKey,
      fileSize: input.file.size,
      mimeType: input.file.mimetype,
      fileHash,
      isEncrypted: true,
    },
  });
}

async function getCaseForEvidenceAccess(caseId: string, userId: string, role: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      report: {
        include: { evidence: true, victimProfile: true },
      },
    },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");

  if (role === "VICTIM" && caseRecord.report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }
  if (role === "POLICE") {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
  }

  return caseRecord;
}

export async function getEvidenceForCase(caseId: string, userId: string, role: string) {
  const caseRecord = await getCaseForEvidenceAccess(caseId, userId, role);
  await prisma.auditLog.create({
    data: { userId, action: "VIEW_EVIDENCE", resource: "case", resourceId: caseId },
  });
  return caseRecord.report.evidence;
}

export async function downloadEvidenceFile(evidenceId: string, userId: string, role: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      report: {
        include: {
          case: true,
          victimProfile: true,
        },
      },
    },
  });
  if (!evidence) throw new AppError(404, "Evidence not found");

  const caseId = evidence.report.case?.id;
  if (!caseId) throw new AppError(404, "Case not found");

  await getCaseForEvidenceAccess(caseId, userId, role);

  if (!(await fileExists(evidence.fileKey))) throw new AppError(404, "File not found on server");

  const buffer = await readEncryptedFile(evidence.fileKey);

  await prisma.auditLog.create({
    data: {
      userId,
      action: "DOWNLOAD_EVIDENCE",
      resource: "evidence",
      resourceId: evidenceId,
    },
  });

  return { buffer, evidence };
}
