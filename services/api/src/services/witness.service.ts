import { prisma, UserRole } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { saveEncryptedFile, readEncryptedFile, fileExists } from "../utils/file-storage";

export async function submitWitnessStatement(input: {
  caseNumber: string;
  statement: string;
  audio?: Express.Multer.File;
}) {
  const caseRecord = await prisma.case.findUnique({
    where: { caseNumber: input.caseNumber.toUpperCase() },
  });
  if (!caseRecord) throw new AppError(404, "Case not found. Check the case number.");

  let audioKey: string | undefined;
  if (input.audio) {
    audioKey = await saveEncryptedFile(input.audio.buffer, input.audio.originalname);
  }

  return prisma.witnessSubmission.create({
    data: {
      caseId: caseRecord.id,
      statement: input.statement,
      audioKey,
    },
  });
}

export async function getWitnessSubmissionsForCase(caseId: string, userId: string, role: UserRole) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { report: { include: { victimProfile: true } }, station: true },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");

  if (role === UserRole.VICTIM && caseRecord.report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }
  if (role === UserRole.POLICE) {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
  }

  return prisma.witnessSubmission.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
    select: { id: true, statement: true, createdAt: true, audioKey: true },
  });
}

export async function downloadWitnessAudio(submissionId: string, userId: string, role: UserRole | string) {
  const submission = await prisma.witnessSubmission.findUnique({
    where: { id: submissionId },
    include: {
      case: {
        include: {
          report: { include: { victimProfile: true } },
        },
      },
    },
  });

  if (!submission) throw new AppError(404, "Witness submission not found");

  const caseRecord = submission.case;
  if (!caseRecord) throw new AppError(404, "Case not found for this submission");

  if (role === UserRole.VICTIM && caseRecord.report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }

  if (role === UserRole.POLICE) {
    const officer = await prisma.policeProfile.findUnique({ where: { userId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
  }

  if (!submission.audioKey || !(await fileExists(submission.audioKey))) {
    throw new AppError(404, "Audio file not found");
  }

  const buffer = await readEncryptedFile(submission.audioKey);
  return { buffer, mime: "audio/mpeg", fileName: "witness-audio.mp3" };
}

// Commit: Add voice recording for witness reports - 2026-06-08T23:41:59

// Commit: Fix file size limit on witness media upload - 2026-06-11T15:25:43

// Commit: Add witness report submission endpoint - 2026-06-12T09:05:58

// Commit: Create witness anonymity protection layer - 2026-06-13T22:01:52

// Commit: Add e2e test scaffold with Playwright - 2026-06-14T13:13:27
