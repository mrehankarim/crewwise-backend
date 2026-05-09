import { Router } from "express";
import {
    checkIn,
    checkOut,
    getMyAttendance,
    getWorkerAttendance,
    getOrganizationAttendance,
} from "../controllers/attendance.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/check-in").post(isLoggedIn, isSubscribed, checkIn);
router.route("/check-out").post(isLoggedIn, isSubscribed, checkOut);
router.route("/my").get(isLoggedIn, isSubscribed, getMyAttendance);
router.route("/worker/:workerId").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkerAttendance);
router.route("/organization/:organizationId").get(isLoggedIn, isSubscribed, isManagerOrSub, getOrganizationAttendance);

export default router;
