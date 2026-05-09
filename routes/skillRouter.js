import { Router } from "express";
import {
    createSkill,
    getSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    assignSkillToWorker,
} from "../controllers/skill.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").get(isLoggedIn, isSubscribed, getSkills);
router.route("/").post(isLoggedIn, isAdmin, createSkill);
router.route("/assign").post(isLoggedIn, isSubscribed, isManagerOrSub, assignSkillToWorker);
router.route("/:skillId").get(isLoggedIn, isSubscribed, getSkillById);
router.route("/:skillId").put(isLoggedIn, isAdmin, updateSkill);
router.route("/:skillId").delete(isLoggedIn, isAdmin, deleteSkill);

export default router;
