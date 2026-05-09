import { Organization } from "../modals/Organization.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { WorkOrder } from "../modals/WorkOrder.js";
import { User } from "../modals/User.js";

const createOrganization = asyncHandler(async (req, res) => {
    const { name, about, industry, location } = req.body;
    if ([name, industry, location].some((field) => !field || field.trim() === "")) {
        throw new apiError(400, "Name, industry, and location are required");
    }
    const organizationExists = await Organization.findOne({ name });
    if (organizationExists) {
        throw new apiError(400, "An organization with this name already exists");
    }
    const organization = await Organization.create({ name, about, industry, location });
    await User.findByIdAndUpdate(req.user._id, { organization: organization._id }, { new: true });
    return res.status(201).json(new apiResponse(201, "Organization Created Successfully", organization));
});

const getOrganizationDetails = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    return res.status(200).json(new apiResponse(200, "Organization Details Fetched Successfully", organization));
});

const updateOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { name, about, industry, location } = req.body;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    if (name) organization.name = name;
    if (about !== undefined) organization.about = about;
    if (industry) organization.industry = industry;
    if (location) organization.location = location;
    await organization.save();
    return res.status(200).json(new apiResponse(200, "Organization Updated Successfully", organization));
});

const deleteOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    organization.isActive = false;
    await organization.save();
    return res.status(200).json(new apiResponse(200, "Organization Deactivated Successfully", {}));
});

const addSubmanagerToOrganization = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    if (!userId) throw new apiError(400, "User ID is required");

    const user = await User.findById(userId);
    if (!user) throw new apiError(404, "User not found");
    if (user.role !== "submanager") throw new apiError(400, "User must have the submanager role");

    const orgId = req.user.organization;
    if (!orgId) throw new apiError(400, "You are not associated with any organization");

    const organization = await Organization.findById(orgId);
    if (!organization) throw new apiError(404, "Organization not found");

    if (user.organization && user.organization.toString() !== orgId.toString()) {
        throw new apiError(400, "User already belongs to a different organization");
    }

    user.organization = orgId;
    user.addedBy = req.user._id;
    await user.save();

    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { "managerDetails.subManagers": userId },
    });

    const updated = await User.findById(userId).select("-password -refreshToken");
    return res.status(200).json(new apiResponse(200, "Sub-manager Added Successfully", updated));
});

const removeSubmanagerFromOrganization = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) throw new apiError(404, "User not found");
    if (user.role !== "submanager") throw new apiError(400, "User is not a sub-manager");

    const orgId = req.user.organization?.toString();
    if (!orgId || user.organization?.toString() !== orgId) {
        throw new apiError(403, "This user does not belong to your organization");
    }

    user.organization = null;
    user.addedBy = null;
    await user.save();

    await User.findByIdAndUpdate(req.user._id, {
        $pull: { "managerDetails.subManagers": user._id },
    });

    return res.status(200).json(new apiResponse(200, "Sub-manager Removed Successfully", {}));
});

const getSubmanagersOfOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    const submanagers = await User.find({ organization: organizationId, role: "submanager" })
        .select("-password -refreshToken")
        .populate("addedBy", "name email");
    return res.status(200).json(new apiResponse(200, "Sub-managers Fetched Successfully", submanagers));
});

const addWorkerToOrganization = asyncHandler(async (req, res) => {
    const { workerId, designatedManagerId } = req.body;
    if (!workerId) throw new apiError(400, "Worker ID is required");

    const worker = await User.findById(workerId);
    if (!worker) throw new apiError(404, "Worker not found");
    if (!["technician", "contractor"].includes(worker.role)) {
        throw new apiError(400, "User must be a technician or contractor");
    }

    const orgId = req.user.organization;
    if (!orgId) throw new apiError(400, "You are not associated with any organization");

    if (worker.organization && worker.organization.toString() !== orgId.toString()) {
        throw new apiError(400, "Worker already belongs to a different organization");
    }

    worker.organization = orgId;
    worker.addedBy = req.user._id;

    if (designatedManagerId) {
        const designatedManager = await User.findById(designatedManagerId);
        if (!designatedManager) throw new apiError(404, "Designated manager not found");
        if (!["manager", "submanager"].includes(designatedManager.role)) {
            throw new apiError(400, "Designated user must be a manager or sub-manager");
        }
        if (designatedManager.organization?.toString() !== orgId.toString()) {
            throw new apiError(400, "Designated manager does not belong to your organization");
        }
        worker.workerDetails.manager = designatedManagerId;
        await User.findByIdAndUpdate(designatedManagerId, {
            $addToSet: { "managerDetails.managedWorkers": workerId },
        });
    }

    await worker.save();
    const updated = await User.findById(workerId).select("-password -refreshToken");
    return res.status(200).json(new apiResponse(200, "Worker Added to Organization Successfully", updated));
});

const removeWorkerFromOrganization = asyncHandler(async (req, res) => {
    const { workerId } = req.params;

    const worker = await User.findById(workerId);
    if (!worker) throw new apiError(404, "Worker not found");
    if (!["technician", "contractor"].includes(worker.role)) {
        throw new apiError(400, "User is not a technician or contractor");
    }

    const orgId = req.user.organization?.toString();
    if (!orgId || worker.organization?.toString() !== orgId) {
        throw new apiError(403, "This worker does not belong to your organization");
    }

    if (worker.workerDetails?.manager) {
        await User.findByIdAndUpdate(worker.workerDetails.manager, {
            $pull: { "managerDetails.managedWorkers": worker._id },
        });
    }

    worker.organization = null;
    worker.addedBy = null;
    worker.workerDetails.manager = null;
    await worker.save();

    return res.status(200).json(new apiResponse(200, "Worker Removed from Organization Successfully", {}));
});

const reassignWorkerManager = asyncHandler(async (req, res) => {
    const { workerId, newManagerId } = req.body;
    if (!workerId || !newManagerId) throw new apiError(400, "Worker ID and new manager ID are required");

    const worker = await User.findById(workerId);
    if (!worker) throw new apiError(404, "Worker not found");
    if (!["technician", "contractor"].includes(worker.role)) {
        throw new apiError(400, "User is not a worker");
    }

    const orgId = req.user.organization?.toString();
    if (!orgId || worker.organization?.toString() !== orgId) {
        throw new apiError(403, "Worker does not belong to your organization");
    }

    const newManager = await User.findById(newManagerId);
    if (!newManager) throw new apiError(404, "Manager not found");
    if (!["manager", "submanager"].includes(newManager.role)) {
        throw new apiError(400, "Target user must be a manager or sub-manager");
    }
    if (newManager.organization?.toString() !== orgId) {
        throw new apiError(400, "Target manager does not belong to your organization");
    }

    if (worker.workerDetails?.manager) {
        await User.findByIdAndUpdate(worker.workerDetails.manager, {
            $pull: { "managerDetails.managedWorkers": worker._id },
        });
    }

    worker.workerDetails.manager = newManagerId;
    await worker.save();

    await User.findByIdAndUpdate(newManagerId, {
        $addToSet: { "managerDetails.managedWorkers": worker._id },
    });

    const updated = await User.findById(workerId).select("-password -refreshToken")
        .populate("workerDetails.manager", "name email role");
    return res.status(200).json(new apiResponse(200, "Worker Reassigned Successfully", updated));
});

const getOrganizationWorkers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { role, page = 1, limit = 20 } = req.query;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    const filter = {
        organization: organizationId,
        role: { $in: ["technician", "contractor"] },
    };
    if (role && ["technician", "contractor"].includes(role)) filter.role = role;
    const skip = (Number(page) - 1) * Number(limit);
    const [workers, total] = await Promise.all([
        User.find(filter).select("-password -refreshToken")
            .populate("workerDetails.manager", "name email role")
            .populate("workerDetails.skills", "name")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Workers Fetched Successfully", {
        workers, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getWorkersOfManager = asyncHandler(async (req, res) => {
    const { managerId } = req.params;
    const manager = await User.findById(managerId);
    if (!manager) throw new apiError(404, "Manager not found");
    if (!["manager", "submanager"].includes(manager.role)) throw new apiError(400, "User is not a manager");
    const workers = await User.find({ "workerDetails.manager": managerId })
        .select("-password -refreshToken")
        .populate("workerDetails.skills", "name");
    return res.status(200).json(new apiResponse(200, "Workers Fetched Successfully", workers));
});

const getOrganizationWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, status, priority } = req.query;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");
    const filter = { organization: organizationId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const skip = (Number(page) - 1) * Number(limit);
    const [workOrders, total] = await Promise.all([
        WorkOrder.find(filter)
            .populate("client", "name email")
            .populate("createdBy", "name")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        WorkOrder.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Work Orders Fetched Successfully", {
        workOrders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getDashboardStats = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const organization = await Organization.findById(organizationId);
    if (!organization) throw new apiError(404, "Organization not found");

    const [
        totalWorkOrders, completedWO, inProgressWO, cancelledWO, assignedWO, createdWO,
        totalWorkers, totalManagers, totalSubmanagers, totalContractors, totalTechnicians,
    ] = await Promise.all([
        WorkOrder.countDocuments({ organization: organizationId }),
        WorkOrder.countDocuments({ organization: organizationId, status: "completed" }),
        WorkOrder.countDocuments({ organization: organizationId, status: "in_progress" }),
        WorkOrder.countDocuments({ organization: organizationId, status: "cancelled" }),
        WorkOrder.countDocuments({ organization: organizationId, status: "assigned" }),
        WorkOrder.countDocuments({ organization: organizationId, status: "created" }),
        User.countDocuments({ organization: organizationId, role: { $in: ["technician", "contractor"] } }),
        User.countDocuments({ organization: organizationId, role: "manager" }),
        User.countDocuments({ organization: organizationId, role: "submanager" }),
        User.countDocuments({ organization: organizationId, role: "contractor" }),
        User.countDocuments({ organization: organizationId, role: "technician" }),
    ]);

    return res.status(200).json(new apiResponse(200, "Dashboard Stats Fetched Successfully", {
        workOrders: {
            total: totalWorkOrders,
            completed: completedWO,
            inProgress: inProgressWO,
            cancelled: cancelledWO,
            assigned: assignedWO,
            created: createdWO,
        },
        team: {
            totalWorkers,
            managers: totalManagers,
            submanagers: totalSubmanagers,
            contractors: totalContractors,
            technicians: totalTechnicians,
        },
    }));
});

const getTotalWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId });
    return res.status(200).json(new apiResponse(200, "Total Work Orders", total));
});

const getCompletedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId, status: "completed" });
    return res.status(200).json(new apiResponse(200, "Completed Work Orders", total));
});

const getInProgressWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId, status: "in_progress" });
    return res.status(200).json(new apiResponse(200, "In Progress Work Orders", total));
});

const getCancelledWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId, status: "cancelled" });
    return res.status(200).json(new apiResponse(200, "Cancelled Work Orders", total));
});

const getAssignedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId, status: "assigned" });
    return res.status(200).json(new apiResponse(200, "Assigned Work Orders", total));
});

const getCreatedWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await WorkOrder.countDocuments({ organization: organizationId, status: "created" });
    return res.status(200).json(new apiResponse(200, "Newly Created Work Orders", total));
});

const getTotalWorkers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await User.countDocuments({ organization: organizationId, role: { $in: ["technician", "contractor"] } });
    return res.status(200).json(new apiResponse(200, "Total Workers", total));
});

const getTotalManagers = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await User.countDocuments({ organization: organizationId, role: { $in: ["manager", "submanager"] } });
    return res.status(200).json(new apiResponse(200, "Total Managers (including sub-managers)", total));
});

const getTotalContractors = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await User.countDocuments({ organization: organizationId, role: "contractor" });
    return res.status(200).json(new apiResponse(200, "Total Contractors", total));
});

const getTotalTechnicians = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const total = await User.countDocuments({ organization: organizationId, role: "technician" });
    return res.status(200).json(new apiResponse(200, "Total Technicians", total));
});

export {
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
};
