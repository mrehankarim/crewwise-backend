import { Router } from "express";
import {
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    getPlans,
} from "../controllers/plan.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";

const router = Router();

router.route("/").get(getPlans);
router.route("/").post(isLoggedIn, isAdmin, createPlan);
router.route("/:planId").get(getPlanById);
router.route("/:planId").put(isLoggedIn, isAdmin, updatePlan);
router.route("/:planId").delete(isLoggedIn, isAdmin, deletePlan);

export default router;
