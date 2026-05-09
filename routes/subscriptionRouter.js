import { Router } from "express";
import {
    subscribeToPlan,
    getOrganizationSubscription,
    getAllSubscriptions,
    cancelSubscription,
    activateSubscription,
    getSubscriptionHistory,
} from "../controllers/subscription.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManager } from "../middlewares/isManager.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isManager, subscribeToPlan);
router.route("/all").get(isLoggedIn, isAdmin, getAllSubscriptions);
router.route("/organization/:organizationId").get(isLoggedIn, isManager, getOrganizationSubscription);
router.route("/organization/:organizationId/history").get(isLoggedIn, isManager, getSubscriptionHistory);
router.route("/:subscriptionId/cancel").patch(isLoggedIn, isAdmin, cancelSubscription);
router.route("/:subscriptionId/activate").patch(isLoggedIn, isAdmin, activateSubscription);

export default router;
