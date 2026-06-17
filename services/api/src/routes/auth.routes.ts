import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { loginUser, refreshAccessToken, logoutUser, registerUser, verify2FALogin, setup2FA, verifyAndEnable2FA, changePassword } from "../services/auth.service";
import { uploadPoliceCredential } from "../services/identity.service";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const policeRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  badgeNumber: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  stationId: z.string().optional(),
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body.email, body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/2fa/login", async (req, res, next) => {
  try {
    const body = z.object({ userId: z.string(), token: z.string() }).parse(req.body);
    const result = await verify2FALogin(body.userId, body.token);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/2fa/setup", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await setup2FA(req.user!.sub, req.user!.email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/2fa/verify", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    const result = await verifyAndEnable2FA(req.user!.sub, token);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/register/police", upload.single("credential"), async (req, res, next) => {
  try {
    const body = policeRegisterSchema.parse(req.body);
    const user = await registerUser({
      email: body.email,
      password: body.password,
      role: "POLICE",
      profile: {
        badgeNumber: body.badgeNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        stationId: body.stationId,
      },
    });
    if (req.file) {
      await uploadPoliceCredential(user.id, req.file);
    }
    res.status(201).json({
      success: true,
      message: "Registration submitted. Awaiting admin approval.",
      data: { id: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const result = await refreshAccessToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    await logoutUser(refreshToken, req.user?.sub);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
});

router.post("/change-password", authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .parse(req.body);
    await changePassword(req.user!.sub, currentPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

// ── OTP: Send ──────────────────────────────────────────────────────
router.post("/otp/send", async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().min(8) }).parse(req.body);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${phone}`;

    // Store in Redis with 10-minute TTL (fall back to in-memory map for local dev)
    try {
      const redis = await import("ioredis");
      const client = new redis.default(env.redisUrl);
      await client.set(key, otp, "EX", 600);
      await client.quit();
    } catch {
      // Redis unavailable — store in process memory (dev only)
      (global as Record<string, unknown>).__otpStore = (global as Record<string, unknown>).__otpStore ?? {};
      ((global as Record<string, unknown>).__otpStore as Record<string, string>)[key] = otp;
      setTimeout(() => {
        if ((global as Record<string, unknown>).__otpStore) {
          delete ((global as Record<string, unknown>).__otpStore as Record<string, string>)[key];
        }
      }, 600_000);
    }

    // Send SMS via Twilio if configured, otherwise log to console
    if (env.twilio.accountSid && env.twilio.authToken && env.twilio.fromNumber) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${env.twilio.accountSid}/Messages.json`;
      const auth = Buffer.from(`${env.twilio.accountSid}:${env.twilio.authToken}`).toString("base64");
      const params = new URLSearchParams({
        To: phone,
        From: env.twilio.fromNumber,
        Body: `Your SafeHer verification code is: ${otp}. Valid for 10 minutes.`,
      });
      await fetch(twilioUrl, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
    } else {
      // Dev fallback: log OTP to console
      console.log(`[SafeHer OTP] Phone: ${phone}  Code: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    next(err);
  }
});

// ── OTP: Verify ────────────────────────────────────────────────────
router.post("/otp/verify", async (req, res, next) => {
  try {
    const { phone, otp } = z.object({ phone: z.string().min(8), otp: z.string().length(6) }).parse(req.body);
    const key = `otp:${phone}`;
    let stored: string | null = null;

    try {
      const redis = await import("ioredis");
      const client = new redis.default(env.redisUrl);
      stored = await client.get(key);
      if (stored === otp) await client.del(key);
      await client.quit();
    } catch {
      const store = ((global as Record<string, unknown>).__otpStore ?? {}) as Record<string, string>;
      stored = store[key] ?? null;
      if (stored === otp) delete store[key];
    }

    if (stored !== otp) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    }

    return res.json({ success: true, message: "Phone verified" });
  } catch (err) {
    next(err);
  }
});

export default router;

