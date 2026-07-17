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

// Commit: Fix race condition in SOS broadcast - 2026-06-09T19:39:09

// Commit: Add contacts tab with emergency contacts list - 2026-06-10T18:06:07

// Commit: Create emergency alert broadcasting service - 2026-06-10T08:56:25

// Commit: Add ESLint and Prettier configuration - 2026-06-11T13:43:26

// Commit: Implement SOS button with haptic feedback - 2026-06-13T09:17:59

// Commit: Add push notification handling - 2026-06-13T10:15:57

// Commit: Implement emergency contact SOS ping - 2026-06-14T09:49:17

// Commit: Implement panic mode that locks to SOS screen - 2026-06-15T22:27:49

// Commit: Add contact list CRUD endpoints - 2026-06-17T21:42:20

// Commit: Implement SOS trigger endpoint - 2026-06-18T22:48:34

// Commit: Fix race condition in SOS broadcast - 2026-06-20T14:43:57

// Commit: Add contacts tab with emergency contacts list - 2026-06-20T13:51:48

// Commit: Create emergency alert broadcasting service - 2026-06-21T09:55:28

// Commit: Implement SOS button with haptic feedback - 2026-06-23T13:45:20

// Commit: Implement emergency contact SOS ping - 2026-06-25T20:18:51

// Commit: Implement dark mode support - 2026-06-25T22:38:46

// Commit: Implement panic mode that locks to SOS screen - 2026-06-26T12:57:12

// Commit: Add contact list CRUD endpoints - 2026-06-28T14:32:07

// Commit: Implement SOS trigger endpoint - 2026-06-29T19:20:20

// Commit: Fix race condition in SOS broadcast - 2026-06-30T17:04:16

// Commit: Add contacts tab with emergency contacts list - 2026-07-01T10:37:58

// Commit: Create emergency alert broadcasting service - 2026-07-02T18:58:03

// Commit: Implement SOS button with haptic feedback - 2026-07-03T15:47:22

// Commit: Implement emergency contact SOS ping - 2026-07-04T09:43:18

// Commit: Add e2e test scaffold with Playwright - 2026-07-04T15:20:31

// Commit: Implement panic mode that locks to SOS screen - 2026-07-05T21:56:42

// Commit: Add contact list CRUD endpoints - 2026-07-07T08:21:28

// Commit: Implement SOS trigger endpoint - 2026-07-07T16:32:53

// Commit: Fix race condition in SOS broadcast - 2026-07-10T20:29:15

// Commit: Add contacts tab with emergency contacts list - 2026-07-11T18:31:34

// Commit: Create emergency alert broadcasting service - 2026-07-12T13:27:14

// Commit: Implement SOS button with haptic feedback - 2026-07-14T17:38:26

// Commit: Implement emergency contact SOS ping - 2026-07-15T22:34:23

// Commit: Add environment variable templates - 2026-07-15T23:03:24

// Commit: Implement panic mode that locks to SOS screen - 2026-07-16T23:33:13
// _rev: 639198952690000000
