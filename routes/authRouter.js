import { Router } from "express";
import { registerUser, loginUser, logOutUser } from "../controllers/auth.controller.js"
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
const router = Router();

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(isLoggedIn, logOutUser)

export default router