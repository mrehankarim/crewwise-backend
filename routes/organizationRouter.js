import { Router } from "express";
import {
    createOrganization,
    getOrganizationDetails,
    updateOrganization,
    deleteOrganization,
    addSubmanagerToOrganization,
    removeSubmanagerFromOrganization,
    getSubmanagersOfOrganization,
    addWorkerToOrganization,
    removeWorkerFromOrganization,
    reassignWorkerManager,
    getWorkersOfManager,
    getOrganizationWorkers,
    getOrganizationWorkOrders,
    getDashboardStats,
    getTotalWorkOrders,
    getCompletedWorkOrders,
    getInProgressWorkOrders,
    getCancelledWorkOrders,
    getAssignedWorkOrders,
    getCreatedWorkOrders,
    getTotalWorkers,
    getTotalManagers,
    getTotalContractors,
    getTotalTechnicians,
} from "../controllers/organization.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManager } from "../middlewares/isManager.middleware.js";
import { isManagerOrSub } from "../middlewares/isManagerOrSub.middleware.js";
import { isSubscribed } from "../middlewares/isSubscribed.middleware.js";

const router = Router();

router.route("/").post(isLoggedIn, isManager, createOrganization);
router.route("/:organizationId").get(isLoggedIn, getOrganizationDetails);
router.route("/:organizationId").put(isLoggedIn, isSubscribed, isManager, updateOrganization);
router.route("/:organizationId").delete(isLoggedIn, isAdmin, deleteOrganization);
router.route("/:organizationId/dashboard").get(isLoggedIn, isSubscribed, isManagerOrSub, getDashboardStats);

router.route("/:organizationId/submanagers").get(isLoggedIn, isSubscribed, isManager, getSubmanagersOfOrganization);
router.route("/submanager/add").post(isLoggedIn, isSubscribed, isManager, addSubmanagerToOrganization);
router.route("/submanager/:userId/remove").delete(isLoggedIn, isSubscribed, isManager, removeSubmanagerFromOrganization);

router.route("/:organizationId/workers").get(isLoggedIn, isSubscribed, isManagerOrSub, getOrganizationWorkers);
router.route("/worker/add").post(isLoggedIn, isSubscribed, isManager, addWorkerToOrganization);
router.route("/worker/:workerId/remove").delete(isLoggedIn, isSubscribed, isManager, removeWorkerFromOrganization);
router.route("/worker/reassign-manager").post(isLoggedIn, isSubscribed, isManager, reassignWorkerManager);
router.route("/manager/:managerId/workers").get(isLoggedIn, isSubscribed, isManagerOrSub, getWorkersOfManager);

router.route("/:organizationId/work-orders").get(isLoggedIn, isSubscribed, isManagerOrSub, getOrganizationWorkOrders);
router.route("/:organizationId/work-orders/total").get(isLoggedIn, isSubscribed, isManagerOrSub, getTotalWorkOrders);
router.route("/:organizationId/work-orders/completed").get(isLoggedIn, isSubscribed, isManagerOrSub, getCompletedWorkOrders);
router.route("/:organizationId/work-orders/in-progress").get(isLoggedIn, isSubscribed, isManagerOrSub, getInProgressWorkOrders);
router.route("/:organizationId/work-orders/assigned").get(isLoggedIn, isSubscribed, isManagerOrSub, getAssignedWorkOrders);
router.route("/:organizationId/work-orders/created").get(isLoggedIn, isSubscribed, isManagerOrSub, getCreatedWorkOrders);
router.route("/:organizationId/work-orders/cancelled").get(isLoggedIn, isSubscribed, isManagerOrSub, getCancelledWorkOrders);

router.route("/:organizationId/workers/total").get(isLoggedIn, isSubscribed, isManagerOrSub, getTotalWorkers);
router.route("/:organizationId/managers/total").get(isLoggedIn, isSubscribed, isManagerOrSub, getTotalManagers);
router.route("/:organizationId/contractors/total").get(isLoggedIn, isSubscribed, isManagerOrSub, getTotalContractors);
router.route("/:organizationId/technicians/total").get(isLoggedIn, isSubscribed, isManagerOrSub, getTotalTechnicians);

export default router;
