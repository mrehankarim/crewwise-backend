import { Subscription } from "../modals/Subscription.js";
import { Plan } from "../modals/Plan.js";
import { Invoice } from "../modals/Invoice.js";
import { Organization } from "../modals/Organization.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const subscribeToPlan = asyncHandler(async (req, res) => {
    const { organizationId, planId } = req.body;
    if (!organizationId || !planId) throw new apiError(400, "Organization ID and Plan ID are required");

    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");

    const plan = await Plan.findById(planId);
    if (!plan) throw new apiError(404, "Plan not found");

    const existing = await Subscription.findOne({ organization: organizationId, isActive: true });
    if (existing) throw new apiError(400, "Organization already has an active subscription");

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (plan.duration || 30));

    const subscription = await Subscription.create({
        organization: organizationId,
        plan: planId,
        startDate,
        endDate,
        isActive: false,
    });

    const invoice = await Invoice.create({
        organization: organizationId,
        subscription: subscription._id,
        amount: plan.price,
        paymentStatus: "pending",
    });

    return res.status(201).json(new apiResponse(201, "Subscription Created - Payment Pending", {
        subscription,
        invoice,
    }));
});

const getOrganizationSubscription = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const subscription = await Subscription.findOne({ organization: organizationId, isActive: true })
        .populate("plan");
    if (!subscription) throw new apiError(404, "No active subscription found");
    return res.status(200).json(new apiResponse(200, "Subscription Fetched Successfully", subscription));
});

const getAllSubscriptions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [subscriptions, total] = await Promise.all([
        Subscription.find()
            .populate("organization", "name industry")
            .populate("plan", "name price maxWorkOrders maxUsers")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        Subscription.countDocuments(),
    ]);
    return res.status(200).json(new apiResponse(200, "Subscriptions Fetched Successfully", {
        subscriptions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const cancelSubscription = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new apiError(404, "Subscription not found");
    subscription.isActive = false;
    await subscription.save();
    return res.status(200).json(new apiResponse(200, "Subscription Cancelled Successfully", subscription));
});

const activateSubscription = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new apiError(404, "Subscription not found");
    subscription.isActive = true;
    await subscription.save();
    return res.status(200).json(new apiResponse(200, "Subscription Activated Successfully", subscription));
});

const getSubscriptionHistory = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const history = await Subscription.find({ organization: organizationId })
        .populate("plan", "name price")
        .sort({ createdAt: -1 });
    return res.status(200).json(new apiResponse(200, "Subscription History Fetched Successfully", history));
});

export {
    subscribeToPlan,
    getOrganizationSubscription,
    getAllSubscriptions,
    cancelSubscription,
    activateSubscription,
    getSubscriptionHistory,
};
