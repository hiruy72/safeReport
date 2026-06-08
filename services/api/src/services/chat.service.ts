import { UserRole, prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";
import { notifyStationOfficers } from "./identity.service";

export async function sendChatMessage(input: {
  caseId: string;
  senderUserId: string;
  senderRole: UserRole;
  content: string;
}) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: input.caseId },
    include: { report: { include: { victimProfile: true } } },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");

  let policeProfileId: string | undefined;

  if (input.senderRole === UserRole.VICTIM) {
    if (caseRecord.report.victimProfile.userId !== input.senderUserId) {
      throw new AppError(403, "Access denied");
    }
  } else if (input.senderRole === UserRole.POLICE) {
    const officer = await prisma.policeProfile.findUnique({ where: { userId: input.senderUserId } });
    if (!officer || officer.stationId !== caseRecord.stationId) {
      throw new AppError(403, "Access denied");
    }
    policeProfileId = officer.id;
  }

  const message = await prisma.chatMessage.create({
    data: {
      caseId: input.caseId,
      senderRole: input.senderRole,
      policeProfileId,
      content: input.content,
    },
    include: { police: { select: { badgeNumber: true } } },
  });

  const notifyUserId =
    input.senderRole === UserRole.VICTIM
      ? caseRecord.investigatorId
        ? (await prisma.policeProfile.findUnique({ where: { id: caseRecord.investigatorId } }))?.userId
        : undefined
      : caseRecord.report.victimProfile.userId;

  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      title: "New Message",
      body: "You have a new message on your case.",
      metadata: { caseId: input.caseId },
    });
  } else if (input.senderRole === UserRole.VICTIM) {
    await notifyStationOfficers(
      caseRecord.stationId,
      "New Message",
      `New message on case ${caseRecord.caseNumber}.`,
      { caseId: input.caseId },
    );
  }

  return {
    id: message.id,
    content: message.content,
    senderRole: message.senderRole,
    senderLabel:
      message.senderRole === UserRole.VICTIM
        ? caseRecord.report.victimProfile.anonymousId
        : `Investigator #${message.police?.badgeNumber ?? "—"}`,
    createdAt: message.createdAt,
  };
}

export async function getChatMessages(caseId: string, userId: string, role: UserRole) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: { report: { include: { victimProfile: true } } },
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

  const messages = await prisma.chatMessage.findMany({
    where: { caseId },
    include: { police: { select: { badgeNumber: true } } },
    orderBy: { createdAt: "asc" },
  });

  const anonymousId = caseRecord.report.victimProfile.anonymousId;

  return messages.map((m) => ({
    id: m.id,
    content: m.content,
    senderRole: m.senderRole,
    senderLabel:
      m.senderRole === UserRole.VICTIM ? anonymousId : `Investigator #${m.police?.badgeNumber ?? "—"}`,
    createdAt: m.createdAt,
  }));
}

export async function createInfoRequest(input: {
  caseId: string;
  policeUserId: string;
  type: string;
  message: string;
}) {
  const officer = await prisma.policeProfile.findUnique({ where: { userId: input.policeUserId } });
  if (!officer) throw new AppError(403, "Police profile not found");

  const caseRecord = await prisma.case.findUnique({
    where: { id: input.caseId },
    include: { report: { include: { victimProfile: true } } },
  });
  if (!caseRecord) throw new AppError(404, "Case not found");

  const request = await prisma.infoRequest.create({
    data: {
      caseId: input.caseId,
      requestedBy: officer.id,
      type: input.type as never,
      message: input.message,
    },
  });

  await createNotification({
    userId: caseRecord.report.victimProfile.userId,
    title: "Additional Information Requested",
    body: input.message,
    metadata: { caseId: input.caseId, requestId: request.id },
  });

  return request;
}

export async function fulfillInfoRequest(requestId: string, userId: string) {
  const request = await prisma.infoRequest.findUnique({
    where: { id: requestId },
    include: {
      case: { include: { report: { include: { victimProfile: true } } } },
    },
  });
  if (!request) throw new AppError(404, "Request not found");
  if (request.case.report.victimProfile.userId !== userId) {
    throw new AppError(403, "Access denied");
  }

  return prisma.infoRequest.update({
    where: { id: requestId },
    data: { status: "FULFILLED", fulfilledAt: new Date() },
  });
}
