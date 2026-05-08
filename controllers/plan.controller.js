import { Plan } from "../modals/Plan.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const createPlan = asyncHandler(async (req, res) => {
    const { name, price, maxWorkOrders, maxUsers, duration } = req.body;
    if (!name || !price || !maxWorkOrders || !maxUsers || !duration) {
        throw new apiError(400, "All fields are required");
    }
    const plan = await Plan.create({
        name,
        price,
        maxWorkOrders,
        maxUsers,
        duration,
    })
    return res.status(200).json(
        new apiResponse(200, "Plan Created Successfully", plan)
    )
})

const updatePlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const { name, price, maxWorkOrders, maxUsers, duration } = req.body;
    if (!planId) {
        throw new apiError(400, "Plan ID is required");
    }
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new apiError(404, "Plan not found");
    }
    plan.name = name;
    plan.price = price;
    plan.maxWorkOrders = maxWorkOrders;
    plan.maxUsers = maxUsers;
    plan.duration = duration;
    await plan.save();
    return res.status(200).json(
        new apiResponse(200, "Plan Updated Successfully", plan)
    )
})

const deletePlan = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    if (!planId) {
        throw new apiError(400, "Plan ID is required");
    }
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new apiError(404, "Plan not found");
    }
    await plan.deleteOne();
    return res.status(200).json(
        new apiResponse(200, "Plan Deleted Successfully", plan)
    )
})

const getPlanById = asyncHandler(async (req, res) => {
    const { planId } = req.params;
    if (!planId) {
        throw new apiError(400, "Plan ID is required");
    }
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new apiError(404, "Plan not found");
    }
    return res.status(200).json(
        new apiResponse(200, "Plan Fetched Successfully", plan)
    )
})

const getPlans = asyncHandler(async (req, res) => {
    const plans = await Plan.find();
    return res.status(200).json(
        new apiResponse(200, "Plans Fetched Successfully", plans)
    )
})



export {
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    getPlans
}