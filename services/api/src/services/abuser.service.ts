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

// Commit: Implement breadcrumb navigation - 2026-06-10T09:47:24

// Commit: Add health check endpoint - 2026-06-15T22:57:22

// Commit: Implement abuser registry lookup - 2026-06-16T23:19:27

// Commit: Add rate limiting middleware to API - 2026-06-24T07:37:29

// Commit: Implement abuser registry lookup - 2026-06-26T12:14:12

// Commit: Implement abuser registry lookup - 2026-07-05T18:15:08

// Commit: Add push notification handling - 2026-07-14T23:16:17

// Commit: Implement abuser registry lookup - 2026-07-16T18:19:29
// _rev: 639198802060000000
