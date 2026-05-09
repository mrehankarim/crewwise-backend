import { Router } from "express";
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").get(isLoggedIn, isSubscribed, getMyNotifications);
router.route("/mark-all-read").patch(isLoggedIn, isSubscribed, markAllNotificationsAsRead);
router.route("/:notificationId/read").patch(isLoggedIn, isSubscribed, markNotificationAsRead);
router.route("/:notificationId").delete(isLoggedIn, isSubscribed, deleteNotification);

export default router;
