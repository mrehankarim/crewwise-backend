import { ordersController } from "../config/paypal.js";
import { Payment } from "../modals/Payment.js";
import { Invoice } from "../modals/Invoice.js";
import { Subscription } from "../modals/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const createPaypalOrder = asyncHandler(async (req, res) => {
    const { invoiceId } = req.body;
    if (!invoiceId) throw new apiError(400, "Invoice ID is required");

    const invoice = await Invoice.findById(invoiceId).populate("organization", "name");
    if (!invoice) throw new apiError(404, "Invoice not found");
    if (invoice.paymentStatus === "paid") throw new apiError(400, "Invoice is already paid");

    const orderRequest = {
        body: {
            intent: "CAPTURE",
            purchaseUnits: [
                {
                    referenceId: invoiceId,
                    description: `CrewWise Subscription - ${invoice.organization?.name || "Organization"}`,
                    amount: {
                        currencyCode: "USD",
                        value: invoice.amount.toFixed(2),
                    },
                },
            ],
            applicationContext: {
                returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
                cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
                userAction: "PAY_NOW",
            },
        },
        prefer: "return=representation",
    };

    const { result: order } = await ordersController.createOrder(orderRequest);

    const payment = await Payment.create({
        invoice: invoiceId,
        amount: invoice.amount,
        currency: "USD",
        paymentMethod: "paypal",
        paypalOrderId: order.id,
        status: "pending",
    });

    const approvalUrl = order.links?.find((l) => l.rel === "payer-action")?.href || null;

    return res.status(201).json(new apiResponse(201, "PayPal Order Created", {
        paypalOrderId: order.id,
        approvalUrl,
        paymentId: payment._id,
    }));
});

const capturePaypalOrder = asyncHandler(async (req, res) => {
    const { paypalOrderId } = req.params;
    if (!paypalOrderId) throw new apiError(400, "PayPal Order ID is required");

    const payment = await Payment.findOne({ paypalOrderId });
    if (!payment) throw new apiError(404, "Payment record not found");
    if (payment.status === "completed") throw new apiError(400, "Payment already captured");

    const { result: captureData } = await ordersController.captureOrder({ id: paypalOrderId, prefer: "return=representation" });

    if (captureData.status === "COMPLETED") {
        const captureId = captureData.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;
        payment.status = "completed";
        payment.paypalCaptureId = captureId;
        payment.paymentDate = new Date();
        await payment.save();

        await Invoice.findByIdAndUpdate(payment.invoice, { paymentStatus: "paid" });

        const invoice = await Invoice.findById(payment.invoice);
        if (invoice?.subscription) {
            await Subscription.findByIdAndUpdate(invoice.subscription, { isActive: true });
        }

        return res.status(200).json(new apiResponse(200, "Payment Captured Successfully", {
            captureId,
            paypalOrderId,
            status: captureData.status,
        }));
    }

    payment.status = "failed";
    await payment.save();
    throw new apiError(400, `Payment capture failed with status: ${captureData.status}`);
});

const getPaymentByInvoice = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const payment = await Payment.findOne({ invoice: invoiceId }).sort({ createdAt: -1 });
    if (!payment) throw new apiError(404, "No payment record found for this invoice");
    return res.status(200).json(new apiResponse(200, "Payment Fetched Successfully", payment));
});

const getAllPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    const [payments, total] = await Promise.all([
        Payment.find(filter)
            .populate({ path: "invoice", populate: { path: "organization", select: "name" } })
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        Payment.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Payments Fetched Successfully", {
        payments, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const refundPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new apiError(404, "Payment not found");
    if (payment.status !== "completed") throw new apiError(400, "Only completed payments can be refunded");

    payment.status = "refunded";
    await payment.save();

    await Invoice.findByIdAndUpdate(payment.invoice, { paymentStatus: "refunded" });

    const invoice = await Invoice.findById(payment.invoice);
    if (invoice?.subscription) {
        await Subscription.findByIdAndUpdate(invoice.subscription, { isActive: false });
    }

    return res.status(200).json(new apiResponse(200, "Payment Refunded Successfully", payment));
});

const getOrganizationPayments = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const invoices = await Invoice.find({ organization: organizationId }).select("_id");
    const invoiceIds = invoices.map((i) => i._id);
    const [payments, total] = await Promise.all([
        Payment.find({ invoice: { $in: invoiceIds } })
            .populate("invoice", "amount paymentStatus issuedAt")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        Payment.countDocuments({ invoice: { $in: invoiceIds } }),
    ]);
    return res.status(200).json(new apiResponse(200, "Organization Payments Fetched Successfully", {
        payments, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

export { createPaypalOrder, capturePaypalOrder, getPaymentByInvoice, getAllPayments, refundPayment, getOrganizationPayments };
