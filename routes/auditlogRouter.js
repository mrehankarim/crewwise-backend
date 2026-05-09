import { Router } from "express";
import {
    createAuditLog,
    getWorkOrderAuditLogs,
    getWorkerAuditLogs,
} from "../controllers/auditlog.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isSubscribed, createAuditLog);
router.route("/work-order/:workOrderId").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkOrderAuditLogs);
router.route("/worker/:workerId").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkerAuditLogs);

export default router;
