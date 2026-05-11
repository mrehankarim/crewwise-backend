import { Subscription } from "../modals/Subscription.js";
import { Invoice } from "../modals/Invoice.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const isSubscribed = asyncHandler(async (req, res, next) => {
    if (req.user.role === "admin") return next();

    const orgId = req.user.organization;
    if (!orgId) {
        throw new apiError(403, "You are not associated with any organization. Contact your manager.");
    }

    const subscription = await Subscription.findOne({
        organization: orgId,
        isActive: true,
        endDate: { $gt: new Date() },
    }).populate("plan");

    if (!subscription) {
        throw new apiError(402, "Payment required. Your organization does not have an active subscription. Please purchase a plan to access this feature.");
    }

    const invoice = await Invoice.findOne({
        subscription: subscription._id,
        paymentStatus: "paid",
    });

    if (!invoice) {
        throw new apiError(402, "Payment required. Your subscription payment has not been completed. Please complete payment to access this feature.");
    }

    req.subscription = subscription;
    next();
});
