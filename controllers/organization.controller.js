import { Organization } from "../modals/Organization.js";
import asyncHandler from "../utils/asyncHandler.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import { WorkOrder } from "../modals/WorkOrder.js";
import { User } from "../modals/User.js";

const createOrganization = asyncHandler(async (req, res) => {
    const { name, about, industry, location } = req.body;
    if ([name, industry, location].some(field => field === "")) {
        throw new apiError(400, "All fields are required");
    }

    const organizationExists = await Organization.findOne({ name });
    if (organizationExists) {
        throw new apiError(400, "Organization already exists");
    }

    const organization = await Organization.create({
        name,
        about,
        industry,
        location,
    })

    await User.findByIdAndUpdate(req.user._id, { organization: organization._id }, { new: true });

    return res.status(200).json(
        new apiResponse(200, "Organization Created Successfully", organization)
    )
})

const addManagerToOrganization = asyncHandler(async (req, res) => {
    const { organizationId, managerId } = req.body;
    if (!organizationId || !managerId) {
        throw new apiError(400, "All fields are required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const manager = await User.findById(managerId);
    if (!manager) {
        throw new apiError(404, "Manager not found");
    }
    if (manager.role !== "manager") {
        throw new apiError(400, "User is not a manager");
    }
    manager.organization = organization._id;
    await manager.save();
    return res.status(200).json(
        new apiResponse(200, "Manager Added Successfully", manager)
    )
})

const getManagersOfOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const managers = await User.find({ organization: organizationId, role: "manager" });
    return res.status(200).json(
        new apiResponse(200, "Managers Fetched Successfully", managers)
    )
})

const addWorkerToOrganization = asyncHandler(async (req, res) => {
    const { organizationId, workerId } = req.body;
    if (!organizationId || !workerId) {
        throw new apiError(400, "All fields are required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const worker = await User.findById(workerId);
    if (!worker) {
        throw new apiError(404, "Worker not found");
    }
    if (worker.role !== "contractor" && worker.role !== "technician") {
        throw new apiError(400, "User is not a worker");
    }
    worker.organization = organization._id;
    await worker.save();
    return res.status(200).json(
        new apiResponse(200, "Worker Added Successfully", worker)
    )
})

const assignWorkerToManager = asyncHandler(async (req, res) => {
    const { managerId, workerId } = req.body;
    if (!managerId || !workerId) {
        throw new apiError(400, "All fields are required");
    }
    const manager = await User.findById(managerId);
    if (!manager) {
        throw new apiError(404, "Manager not found");
    }
    const worker = await User.findById(workerId);
    if (!worker) {
        throw new apiError(404, "Worker not found");
    }
    if (manager.role !== "manager") {
        throw new apiError(400, "User is not a manager");
    }
    if (worker.role !== "contractor" && worker.role !== "technician") {
        throw new apiError(400, "User is not a worker");
    }
    manager.managerDetails.managedWorkers.push(workerId);
    await manager.save();
    worker.workerDetails.manager = managerId;
    await worker.save();
    return res.status(200).json(
        new apiResponse(200, "Worker Assigned Successfully", { manager, worker })
    )
})

const getWorkersOfManager = asyncHandler(async (req, res) => {
    const { managerId } = req.params;
    if (!managerId) {
        throw new apiError(400, "Manager ID is required");
    }
    const manager = await User.findById(managerId);
    if (!manager) {
        throw new apiError(404, "Manager not found");
    }
    const workers = await User.find({ manager: managerId });
    return res.status(200).json(
        new apiResponse(200, "Workers Fetched Successfully", workers)
    )
})

const getOrganizationWorkers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const workers = await User.find({ organization: organizationId });
    return res.status(200).json(
        new apiResponse(200, "Workers Fetched Successfully", workers)
    )
})

const getOrganizationWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId, page_no, limit } = req.params;
    if (!organizationId || !page_no || !limit) {
        throw new apiError(400, "Organization ID, Page No and Limit are required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const workOrders = await WorkOrder.find({ organization: organizationId }).skip((page_no - 1) * limit).limit(limit);
    return res.status(200).json(
        new apiResponse(200, "Work Orders Fetched Successfully", workOrders)
    )
})

const getTotalWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const totalWorkOrders = await WorkOrder.countDocuments({ organization: organizationId });
    return res.status(200).json(
        new apiResponse(200, "Total Work Orders Fetched Successfully", totalWorkOrders)
    )
})

const getCompletedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const completedWorkOrders = await WorkOrder.countDocuments({ organization: organizationId, status: "completed" });
    return res.status(200).json(
        new apiResponse(200, "Completed Work Orders Fetched Successfully", completedWorkOrders)
    )
})

const getInProgressWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const inProgressWorkOrders = await WorkOrder.countDocuments({ organization: organizationId, status: "in_progress" });
    return res.status(200).json(
        new apiResponse(200, "In Progress Work Orders Fetched Successfully", inProgressWorkOrders)
    )
})

const getCancelledWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const cancelledWorkOrders = await WorkOrder.countDocuments({ organization: organizationId, status: "cancelled" });
    return res.status(200).json(
        new apiResponse(200, "Cancelled Work Orders Fetched Successfully", cancelledWorkOrders)
    )
})

const getAssignedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const assignedWorkOrders = await WorkOrder.countDocuments({ organization: organizationId, status: "assigned" });
    return res.status(200).json(
        new apiResponse(200, "Assigned Work Orders Fetched Successfully", assignedWorkOrders)
    )
})

const getCreatedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const createdWorkOrders = await WorkOrder.countDocuments({ organization: organizationId, status: "created" });
    return res.status(200).json(
        new apiResponse(200, "Created Work Orders Fetched Successfully", createdWorkOrders)
    )
})

const getOrganizationDetails = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    return res.status(200).json(
        new apiResponse(200, "Organization Details Fetched Successfully", organization)
    )
})

const getTotalWorkers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const totalWorkers = await User.countDocuments({ organization: organizationId });
    return res.status(200).json(
        new apiResponse(200, "Total Workers Fetched Successfully", totalWorkers)
    )
})

const getTotalManagers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const totalManagers = await User.countDocuments({ organization: organizationId, role: "manager" });
    return res.status(200).json(
        new apiResponse(200, "Total Managers Fetched Successfully", totalManagers)
    )
})

const getTotalContractors = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const totalContractors = await User.countDocuments({ organization: organizationId, role: "contractor" });
    return res.status(200).json(
        new apiResponse(200, "Total Contractors Fetched Successfully", totalContractors)
    )
})

const getTotalTechnicians = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    if (!organizationId) {
        throw new apiError(400, "Organization ID is required");
    }
    const organization = await Organization.findById(organizationId);
    if (!organization) {
        throw new apiError(404, "Organization not found");
    }
    const totalTechnicians = await User.countDocuments({ organization: organizationId, role: "technician" });
    return res.status(200).json(
        new apiResponse(200, "Total Technicians Fetched Successfully", totalTechnicians)
    )
})



export {
    createOrganization,
    addManagerToOrganization,
    getManagersOfOrganization,
    addWorkerToOrganization,
    assignWorkerToManager,
    getWorkersOfManager,
    getOrganizationWorkers,
    getTotalWorkOrders,
    getCompletedWorkOrders,
    getInProgressWorkOrders,
    getAssignedWorkOrders,
    getCreatedWorkOrders,
    getCancelledWorkOrders,
    getOrganizationDetails,
    getTotalWorkers,
    getTotalManagers,
    getTotalContractors,
    getTotalTechnicians
}

