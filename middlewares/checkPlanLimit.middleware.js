import { WorkOrder } from "../modals/WorkOrder.js";
import { User } from "../modals/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";


export const checkPlanLimit = (limitType) => asyncHandler(async (req, res, next) => {
    if (req.user.role === "admin") return next();

    const subscription = req.subscription;
    if (!subscription || !subscription.plan) {
        throw new apiError(402, "Active subscription required to verify plan limits.");
    }

    const plan = subscription.plan;
    const organizationId = req.user.organization;

    if (!organizationId) {
        throw new apiError(403, "Organization not found for current user.");
    }

    if (limitType === "maxWorkOrders") {
        const count = await WorkOrder.countDocuments({ organization: organizationId });
        if (count >= plan.maxWorkOrders) {
            throw new apiError(403, `Plan limit reached: Your ${plan.name} plan allows a maximum of ${plan.maxWorkOrders} work orders. Please upgrade your plan to create more.`);
        }
    }

    if (limitType === "maxUsers") {
        const count = await User.countDocuments({ organization: organizationId });
        if (count >= plan.maxUsers) {
            throw new apiError(403, `Plan limit reached: Your ${plan.name} plan allows a maximum of ${plan.maxUsers} users. Please upgrade your plan to add more team members.`);
        }
    }

    next();
});
