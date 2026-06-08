import { prisma } from "@safeher/db";
import { AppError } from "../middleware/errorHandler";
import { sendExternalAlert } from "./notification.service";

const MAX_CONTACTS = 5;

async function getVictimProfileId(userId: string): Promise<string> {
  const victim = await prisma.victimProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!victim) throw new AppError(404, "Victim profile not found");
  return victim.id;
}

export async function listEmergencyContacts(userId: string) {
  const victimProfileId = await getVictimProfileId(userId);
  return prisma.emergencyContact.findMany({
    where: { victimProfileId },
    orderBy: { createdAt: "asc" },
  });
}

export async function addEmergencyContact(
  userId: string,
  input: { name: string; phone: string; relationship?: string; email?: string; notifyOnSos?: boolean },
) {
  const victimProfileId = await getVictimProfileId(userId);

  const count = await prisma.emergencyContact.count({ where: { victimProfileId } });
  if (count >= MAX_CONTACTS) {
    throw new AppError(400, `You can add at most ${MAX_CONTACTS} emergency contacts`);
  }

  return prisma.emergencyContact.create({
    data: {
      victimProfileId,
      name: input.name,
      phone: input.phone,
      relationship: input.relationship,
      email: input.email,
      notifyOnSos: input.notifyOnSos ?? true,
    },
  });
}

export async function updateEmergencyContact(
  userId: string,
  contactId: string,
  input: { name?: string; phone?: string; relationship?: string; email?: string; notifyOnSos?: boolean },
) {
  const victimProfileId = await getVictimProfileId(userId);
  const existing = await prisma.emergencyContact.findFirst({ where: { id: contactId, victimProfileId } });
  if (!existing) throw new AppError(404, "Emergency contact not found");

  return prisma.emergencyContact.update({
    where: { id: contactId },
    data: {
      name: input.name,
      phone: input.phone,
      relationship: input.relationship,
      email: input.email,
      notifyOnSos: input.notifyOnSos,
    },
  });
}

export async function deleteEmergencyContact(userId: string, contactId: string) {
  const victimProfileId = await getVictimProfileId(userId);
  const result = await prisma.emergencyContact.deleteMany({ where: { id: contactId, victimProfileId } });
  if (result.count === 0) throw new AppError(404, "Emergency contact not found");
  return { success: true };
}

/**
 * Alert all of a victim's opted-in emergency contacts that they triggered an SOS.
 * Best-effort: a failure to reach one contact never blocks the SOS flow.
 */
export async function notifyEmergencyContactsOfSos(
  victimProfileId: string,
  options: { caseNumber?: string; latitude?: number; longitude?: number },
): Promise<number> {
  const contacts = await prisma.emergencyContact.findMany({
    where: { victimProfileId, notifyOnSos: true },
  });
  if (contacts.length === 0) return 0;

  const hasLocation = options.latitude != null && options.longitude != null;
  const mapsLink = hasLocation
    ? ` View location: https://maps.google.com/?q=${options.latitude},${options.longitude}`
    : "";
  const caseRef = options.caseNumber ? ` (case ${options.caseNumber})` : "";
  const body =
    `Someone you are an emergency contact for has triggered an SOS alert on SafeHer${caseRef} ` +
    `and may need urgent help.${mapsLink}`;

  await Promise.allSettled(
    contacts.map((c) =>
      sendExternalAlert({
        phone: c.phone,
        email: c.email,
        subject: "🚨 SafeHer SOS Alert",
        body: `Hi ${c.name}, ${body}`,
      }),
    ),
  );

  return contacts.length;
}
