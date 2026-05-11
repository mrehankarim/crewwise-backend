import { Router } from "express";
import {
    createWorkOrder, getWorkOrderById, updateWorkOrder, deleteWorkOrder,
    updateWorkOrderStatus, assignWorkOrderToWorker, unassignWorkerFromWorkOrder,
    getWorkOrderAssignments, getMyWorkOrders, addPartToWorkOrder,
    removePartFromWorkOrder, returnPartFromWorkOrder, addAttachmentToWorkOrder,
    getOrganizationWorkOrders, getWorkOrderStats, getAllWorkOrders,
} from "../controllers/workorder.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isWorker } from "../middlewares/isWorker.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";
import { checkPlanLimit } from "../middlewares/checkPlanLimit.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isSubscribed, isManagerOrSub, checkPlanLimit("maxWorkOrders"), createWorkOrder);
router.route("/all").get(isLoggedIn, isAdmin, getAllWorkOrders);
router.route("/my").get(isLoggedIn, isSubscribed, isWorker, getMyWorkOrders);
router.route("/assign").post(isLoggedIn, isSubscribed, isManagerOrSub, assignWorkOrderToWorker);
router.route("/unassign").post(isLoggedIn, isSubscribed, isManagerOrSub, unassignWorkerFromWorkOrder);
router.route("/organization/:organizationId").get(isLoggedIn, isSubscribed, isManagerOrSub, getOrganizationWorkOrders);
router.route("/organization/:organizationId/stats").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkOrderStats);
router.route("/:workOrderId").get(isLoggedIn, isSubscribed, getWorkOrderById);
router.route("/:workOrderId").put(isLoggedIn, isSubscribed, isManagerOrSub, updateWorkOrder);
router.route("/:workOrderId").delete(isLoggedIn, isSubscribed, isManagerOrSub, deleteWorkOrder);
router.route("/:workOrderId/status").patch(isLoggedIn, isSubscribed, isManagerOrSub, updateWorkOrderStatus);
router.route("/:workOrderId/assignments").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkOrderAssignments);
router.route("/:workOrderId/parts").post(isLoggedIn, isSubscribed, isManagerOrSub, addPartToWorkOrder);
router.route("/:workOrderId/parts/return").post(isLoggedIn, isSubscribed, isWorker, returnPartFromWorkOrder);
router.route("/:workOrderId/parts/:inventoryItemId").delete(isLoggedIn, isSubscribed, isManagerOrSub, removePartFromWorkOrder);
router.route("/:workOrderId/attachments").post(isLoggedIn, isSubscribed, isWorker, upload.single("file"), addAttachmentToWorkOrder);

export default router;
