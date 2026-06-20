import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import victimRoutes from "./routes/victim.routes";
import policeRoutes from "./routes/police.routes";
import adminRoutes from "./routes/admin.routes";
import caseRoutes, { evidenceRouter } from "./routes/case.routes";
import notificationRoutes from "./routes/notification.routes";
import witnessRoutes from "./routes/witness.routes";
import { getRegions } from "./services/admin.service";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "safeher-api", timestamp: new Date().toISOString() });
  });

  // Public endpoint — needed for victim/police registration forms (unauthenticated)
  app.get("/api/regions", async (_req, res, next) => {
    try {
      const regions = await getRegions();
      res.json({ success: true, data: regions });
    } catch (err) {
      next(err);
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/victims", victimRoutes);
  app.use("/api/police", policeRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/cases", caseRoutes);
  app.use("/api/evidence", evidenceRouter);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/witness", witnessRoutes);

  app.use(errorHandler);

  return app;
}

