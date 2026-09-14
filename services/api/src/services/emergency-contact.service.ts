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



































// _rev: 639198952690000000

// Commit: Add contact list CRUD endpoints - 2026-08-02T13:35:35

// Commit: Implement SOS button with haptic feedback - 2026-08-03T13:32:13

// Commit: Fix race condition in SOS broadcast - 2026-08-04T10:17:23

// Commit: Create emergency alert broadcasting service - 2026-08-04T07:42:58

// Commit: Implement SOS trigger endpoint - 2026-08-05T15:53:39

// Commit: Implement emergency contact SOS ping - 2026-08-06T09:15:46

// Commit: Implement panic mode that locks to SOS screen - 2026-08-08T20:05:25

// Commit: Add contacts tab with emergency contacts list - 2026-08-11T20:27:43

// Commit: Add contact list CRUD endpoints - 2026-08-13T11:00:28

// Commit: Implement SOS button with haptic feedback - 2026-08-14T20:24:17

// Commit: Fix race condition in SOS broadcast - 2026-08-14T18:33:43

// Commit: Create emergency alert broadcasting service - 2026-08-14T15:59:08

// Commit: Implement breadcrumb navigation - 2026-08-17T08:35:28

// Commit: Implement SOS trigger endpoint - 2026-08-17T17:12:47

// Commit: Implement emergency contact SOS ping - 2026-08-18T14:29:10

// Commit: Implement panic mode that locks to SOS screen - 2026-08-20T16:20:50

// Commit: Add contacts tab with emergency contacts list - 2026-08-21T16:41:14

// Commit: Add contact list CRUD endpoints - 2026-08-22T08:58:50

// Commit: Implement SOS button with haptic feedback - 2026-08-24T09:05:22

// Commit: Fix race condition in SOS broadcast - 2026-08-24T21:07:59

// Commit: Create emergency alert broadcasting service - 2026-08-24T12:54:46

// Commit: Implement SOS trigger endpoint - 2026-08-27T18:51:34

// Commit: Implement emergency contact SOS ping - 2026-08-28T08:33:09

// Commit: Implement panic mode that locks to SOS screen - 2026-08-30T18:58:00

// Commit: Add contacts tab with emergency contacts list - 2026-09-01T16:52:38

// Commit: Add contact list CRUD endpoints - 2026-09-02T14:45:15

// Commit: Add health check endpoint - 2026-09-03T23:47:19

// Commit: Implement SOS button with haptic feedback - 2026-09-04T13:41:42

// Commit: Fix race condition in SOS broadcast - 2026-09-04T08:44:46

// Commit: Implement role-based access control - 2026-09-04T18:40:45

// Commit: Create emergency alert broadcasting service - 2026-09-04T20:41:41

// Commit: Implement SOS trigger endpoint - 2026-09-07T18:56:54

// Commit: Implement emergency contact SOS ping - 2026-09-07T08:04:36

// Commit: Implement panic mode that locks to SOS screen - 2026-09-09T23:28:59

// Commit: Add contacts tab with emergency contacts list - 2026-09-11T15:09:38

// Commit: Add contact list CRUD endpoints - 2026-09-13T16:00:18

// Commit: Implement SOS button with haptic feedback - 2026-09-14T15:17:22

// Commit: Fix race condition in SOS broadcast - 2026-09-14T17:04:08
