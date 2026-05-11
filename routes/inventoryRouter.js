import { Router } from "express";
import {
    createInventoryItem,
    getInventoryItems,
    getInventoryItemById,
    updateInventoryItem,
    deleteInventoryItem,
    assignInverntoryItemToWorkOrder,
    deassignInventoryItemFromWorkOrder,
    getInventoryItemsByOrganization,
} from "../controllers/inventory.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";
import { isWorker } from "../middlewares/isWorker.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isSubscribed, isManagerOrSub, createInventoryItem);
router.route("/").get(isLoggedIn, isSubscribed, isManagerOrSub, getInventoryItems);
router.route("/organization/:organizationId").get(isLoggedIn, isSubscribed, getInventoryItemsByOrganization);
router.route("/:inventoryItemId").get(isLoggedIn, isSubscribed, isManagerOrSub, getInventoryItemById);
router.route("/:inventoryItemId").put(isLoggedIn, isSubscribed, isManagerOrSub, updateInventoryItem);
router.route("/:inventoryItemId").delete(isLoggedIn, isSubscribed, isManagerOrSub, deleteInventoryItem);
router.route("/:inventoryItemId/assign/:workOrderId").post(isLoggedIn, isSubscribed, isManagerOrSub, assignInverntoryItemToWorkOrder);
router.route("/:inventoryItemId/deassign/:workOrderId").delete(isLoggedIn, isSubscribed, isManagerOrSub, deassignInventoryItemFromWorkOrder);

export default router;
