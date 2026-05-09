import { Invoice } from "../modals/Invoice.js";
import { Subscription } from "../modals/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const getInvoiceById = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const invoice = await Invoice.findById(invoiceId)
        .populate("organization", "name industry location")
        .populate({ path: "subscription", populate: { path: "plan", select: "name price duration maxWorkOrders maxUsers" } });
    if (!invoice) throw new apiError(404, "Invoice not found");
    return res.status(200).json(new apiResponse(200, "Invoice Fetched Successfully", invoice));
});

const getOrganizationInvoices = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { organization: organizationId };
    if (status) filter.paymentStatus = status;
    const [invoices, total] = await Promise.all([
        Invoice.find(filter)
            .populate({ path: "subscription", populate: { path: "plan", select: "name price" } })
            .skip(skip).limit(Number(limit)).sort({ issuedAt: -1 }),
        Invoice.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Invoices Fetched Successfully", {
        invoices, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getAllInvoices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.paymentStatus = status;
    const [invoices, total] = await Promise.all([
        Invoice.find(filter)
            .populate("organization", "name")
            .populate({ path: "subscription", populate: { path: "plan", select: "name price" } })
            .skip(skip).limit(Number(limit)).sort({ issuedAt: -1 }),
        Invoice.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "All Invoices Fetched Successfully", {
        invoices, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { invoiceId } = req.params;
    const { paymentStatus } = req.body;
    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) throw new apiError(400, "Invalid payment status");
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new apiError(404, "Invoice not found");
    invoice.paymentStatus = paymentStatus;
    await invoice.save();
    return res.status(200).json(new apiResponse(200, "Invoice Status Updated", invoice));
});

export { getInvoiceById, getOrganizationInvoices, getAllInvoices, updateInvoiceStatus };