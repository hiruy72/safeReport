import { NotificationChannel, Prisma, prisma } from "@safeher/db";
import { env } from "../config/env";
import { decryptPayload } from "../utils/crypto";

async function sendEmail(to: string, subject: string, body: string) {
  if (!env.smtp.host || !env.smtp.user) return;
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
    await transport.sendMail({ from: env.smtp.from, to, subject, text: body });
  } catch (err) {
    console.error("[Email]", err);
  }
}

async function sendSms(to: string, body: string) {
  if (!env.twilio.accountSid || !env.twilio.authToken || !env.twilio.fromNumber) return;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${env.twilio.accountSid}/Messages.json`;
    const auth = Buffer.from(`${env.twilio.accountSid}:${env.twilio.authToken}`).toString("base64");
    const params = new URLSearchParams({ To: to, From: env.twilio.fromNumber, Body: body });
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
  } catch (err) {
    console.error("[SMS]", err);
  }
}

/**
 * Send an alert to an external recipient who is NOT a platform user
 * (e.g. a victim's emergency contact). Best-effort across SMS + email.
 */
export async function sendExternalAlert(input: {
  phone?: string | null;
  email?: string | null;
  subject: string;
  body: string;
}) {
  if (input.phone) await sendSms(input.phone, `${input.subject}: ${input.body}`);
  if (input.email) await sendEmail(input.email, input.subject, input.body);
}

async function resolveUserPhone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      policeProfile: { select: { phone: true } },
      victimProfile: { include: { identityVault: { select: { encryptedPayload: true } } } },
    },
  });
  if (!user) return null;
  if (user.policeProfile?.phone) return user.policeProfile.phone;
  if (user.victimProfile?.identityVault?.encryptedPayload) {
    try {
      const identity = decryptPayload<{ phone: string }>(user.victimProfile.identityVault.encryptedPayload);
      return identity.phone ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Prisma.InputJsonValue;
  sendEmailToo?: boolean;
  sendSmsToo?: boolean;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      channel: input.channel ?? NotificationChannel.IN_APP,
      metadata: input.metadata ?? undefined,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true } });

  if (input.sendEmailToo && user?.email) {
    await sendEmail(user.email, input.title, input.body);
  }

  if (input.sendSmsToo) {
    const phone = await resolveUserPhone(input.userId);
    if (phone) {
      await sendSms(phone, `${input.title}: ${input.body}`);
      await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          body: input.body,
          channel: NotificationChannel.SMS,
        },
      });
    }
  }

  return notification;
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly && { read: false }) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
