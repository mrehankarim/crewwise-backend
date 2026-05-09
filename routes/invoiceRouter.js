import { Router } from "express";
import {
    getInvoiceById,
    getOrganizationInvoices,
    getAllInvoices,
    updateInvoiceStatus,
} from "../controllers/invoice.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManager } from "../middlewares/isManager.middleware.js";

const router = Router();

router.route("/all").get(isLoggedIn, isAdmin, getAllInvoices);
router.route("/organization/:organizationId").get(isLoggedIn, isManager, getOrganizationInvoices);
router.route("/:invoiceId").get(isLoggedIn, isManager, getInvoiceById);
router.route("/:invoiceId/status").patch(isLoggedIn, isAdmin, updateInvoiceStatus);

export default router;
