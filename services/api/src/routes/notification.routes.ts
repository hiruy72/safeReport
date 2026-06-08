import { Router } from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";
import { authenticate, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const notifications = await getUserNotifications(req.user!.sub, unreadOnly);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req: AuthenticatedRequest, res, next) => {
  try {
    await markNotificationRead(req.user!.sub, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/read-all", async (req: AuthenticatedRequest, res, next) => {
  try {
    await markAllNotificationsRead(req.user!.sub);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
