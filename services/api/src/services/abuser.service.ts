import { prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { saveEncryptedFile, readEncryptedFile, fileExists, deleteFile } from "../utils/file-storage";
import { sanitizeFileBuffer } from "../utils/image-sanitize";

export async function uploadAbuserPhoto(
  reportId: string,
  userId: string,
  file: Express.Multer.File,
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { victimProfile: true },
  });
  if (!report) throw new AppError(404, "Report not found");
  if (report.victimProfile.userId !== userId) throw new AppError(403, "Access denied");

  const oldPhotoKey = report.abuserPhotoKey;
  const sanitized = await sanitizeFileBuffer(file.buffer, file.mimetype);
  const photoKey = await saveEncryptedFile(sanitized, file.originalname);

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { abuserPhotoKey: photoKey },
    select: { id: true, abuserPhotoKey: true },
  });

  if (oldPhotoKey) await deleteFile(oldPhotoKey);
  return updated;
}

export async function getAbuserPhoto(reportId: string, userId: string, role: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      case: true,
      victimProfile: true,
    },
  });
  if (!report) throw new AppError(404, "Report not found");

  if (role === "VICTIM" && report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }

  if (role === "POLICE") {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || (report.case && officer.stationId !== report.case.stationId)) {
      throw new AppError(403, "Access denied");
    }
  }

  if (!report.abuserPhotoKey || !(await fileExists(report.abuserPhotoKey))) {
    throw new AppError(404, "Photo not found");
  }

  const buffer = await readEncryptedFile(report.abuserPhotoKey);
  return { buffer, mime: "image/jpeg", fileName: "abuser-photo.jpg" };
}








// _rev: 639204194710000000

// Commit: Resolve TypeScript strict errors in API layer - 2026-08-03T22:06:53

// Commit: Implement abuser registry lookup - 2026-08-04T10:55:45

// Commit: Configure pnpm workspace and dependencies - 2026-08-08T14:34:48

// Commit: Implement abuser registry lookup - 2026-08-16T12:05:19

// Commit: Implement abuser registry lookup - 2026-08-25T11:00:26

// Commit: Implement abuser registry lookup - 2026-09-05T11:27:03

// Commit: Create common UI components library - 2026-09-05T07:56:55

// Commit: Implement abuser registry lookup - 2026-09-15T16:58:43
