import { Router } from "express";
import {
    registerUser, loginUser, logOutUser,
    getMe, updateProfile, changePassword,
    getAllUsers, getUserById, updateUserRole, toggleUserActive,
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(isLoggedIn, logOutUser);
router.route("/me").get(isLoggedIn, getMe);
router.route("/me/update").put(isLoggedIn, updateProfile);
router.route("/me/change-password").patch(isLoggedIn, changePassword);

router.route("/users").get(isLoggedIn, isAdmin, getAllUsers);
router.route("/users/:userId").get(isLoggedIn, isAdmin, getUserById);
router.route("/users/:userId/role").patch(isLoggedIn, isAdmin, updateUserRole);
router.route("/users/:userId/toggle-active").patch(isLoggedIn, isAdmin, toggleUserActive);

export default router;