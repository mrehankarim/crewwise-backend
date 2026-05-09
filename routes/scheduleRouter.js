import { Router } from "express";
import {
    createSchedule,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
    getWorkerSchedules,
    getMySchedules,
    getWorkOrderSchedules,
} from "../controllers/schedule.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isSubscribed, isManagerOrSub, createSchedule);
router.route("/my").get(isLoggedIn, isSubscribed, getMySchedules);
router.route("/:scheduleId").get(isLoggedIn, isSubscribed, getScheduleById);
router.route("/:scheduleId").put(isLoggedIn, isSubscribed, isManagerOrSub, updateSchedule);
router.route("/:scheduleId").delete(isLoggedIn, isSubscribed, isManagerOrSub, deleteSchedule);
router.route("/worker/:workerId").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkerSchedules);
router.route("/work-order/:workOrderId").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkOrderSchedules);

export default router;
