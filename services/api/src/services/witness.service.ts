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





















// _rev: 639203419070000000

// Commit: Add identity verification flow - 2026-08-02T11:42:52

// Commit: Implement chat between victim and officer - 2026-08-03T10:40:13

// Commit: Create common UI components library - 2026-08-05T18:51:52

// Commit: Add witness report submission endpoint - 2026-08-06T21:32:18

// Commit: Add unit tests for witness service - 2026-08-09T15:26:17

// Commit: Fix file size limit on witness media upload - 2026-08-09T14:03:04

// Commit: Create witness anonymity protection layer - 2026-08-10T09:37:52

// Commit: Add voice recording for witness reports - 2026-08-10T18:02:32

// Commit: Add toast notification system - 2026-08-14T23:45:43

// Commit: Add witness report submission endpoint - 2026-08-18T21:23:14

// Commit: Add unit tests for witness service - 2026-08-20T15:41:44

// Commit: Fix file size limit on witness media upload - 2026-08-20T23:55:17

// Commit: Create witness anonymity protection layer - 2026-08-21T11:10:26

// Commit: Add voice recording for witness reports - 2026-08-21T17:43:58

// Commit: Implement shared crypto utilities - 2026-08-22T12:09:43

// Commit: Add witness report submission endpoint - 2026-08-28T23:38:00

// Commit: Add unit tests for witness service - 2026-08-30T18:55:23

// Commit: Fix file size limit on witness media upload - 2026-08-31T10:18:28

// Commit: Create witness anonymity protection layer - 2026-08-31T16:31:03

// Commit: Add voice recording for witness reports - 2026-09-01T20:19:25

// Commit: Implement dark mode support - 2026-09-04T10:05:37

// Commit: Add witness report submission endpoint - 2026-09-07T18:04:10

// Commit: Add unit tests for witness service - 2026-09-10T11:21:04

// Commit: Fix file size limit on witness media upload - 2026-09-10T23:57:19

// Commit: Create witness anonymity protection layer - 2026-09-10T18:06:32

// Commit: Add voice recording for witness reports - 2026-09-11T22:41:16

// Commit: Add witness report submission endpoint - 2026-09-17T18:01:54

// Commit: Add unit tests for witness service - 2026-09-20T12:13:01

// Commit: Fix file size limit on witness media upload - 2026-09-20T10:44:04
