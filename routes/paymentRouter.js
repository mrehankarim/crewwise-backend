import { Router } from "express";
import {
    createPaypalOrder,
    capturePaypalOrder,
    getPaymentByInvoice,
    getAllPayments,
    refundPayment,
    getOrganizationPayments,
} from "../controllers/payment.controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.middleware.js";
import { isAdmin } from "../middlewares/isAdmin.middleware.js";
import { isManager } from "../middlewares/isManager.middleware.js";

const router = Router();

router.route("/paypal/create-order").post(isLoggedIn, isManager, createPaypalOrder);
router.route("/paypal/capture/:paypalOrderId").post(isLoggedIn, capturePaypalOrder);
router.route("/all").get(isLoggedIn, isAdmin, getAllPayments);
router.route("/organization/:organizationId").get(isLoggedIn, isManager, getOrganizationPayments);
router.route("/invoice/:invoiceId").get(isLoggedIn, isManager, getPaymentByInvoice);
router.route("/:paymentId/refund").patch(isLoggedIn, isAdmin, refundPayment);

export default router;
