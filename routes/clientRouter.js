import { Router } from "express";
import {
    createClient,
    getClientById,
    updateClient,
    deleteClient,
    getClientsByOrganization,
    addClientLocation,
    removeClientLocation,
} from "../controllers/client.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isSubscribed, isManagerOrSub, createClient);
router.route("/organization/:organizationId").get(isLoggedIn, isSubscribed, isManagerOrSub, getClientsByOrganization);
router.route("/:clientId").get(isLoggedIn, isSubscribed, isManagerOrSub, getClientById);
router.route("/:clientId").put(isLoggedIn, isSubscribed, isManagerOrSub, updateClient);
router.route("/:clientId").delete(isLoggedIn, isSubscribed, isManagerOrSub, deleteClient);
router.route("/:clientId/locations").post(isLoggedIn, isSubscribed, isManagerOrSub, addClientLocation);
router.route("/:clientId/locations/:locationId").delete(isLoggedIn, isSubscribed, isManagerOrSub, removeClientLocation);

export default router;
