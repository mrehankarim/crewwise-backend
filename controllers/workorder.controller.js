import { WorkOrder } from "../modals/WorkOrder.js";
import { WorkOrderAssignment } from "../modals/WorkOrderAssignment.js";
import { User } from "../modals/User.js";
import { Client } from "../modals/Client.js";
import { InventoryItem } from "../modals/InventoryItem.js";
import { AuditLog } from "../modals/AuditLog.js";
import { Notification } from "../modals/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import fileUploader from "../utils/cloudinary.js";

const createWorkOrder = asyncHandler(async (req, res) => {
    const { title, category, priority, clientId, clientLocationId } = req.body;
    const organizationId = req.body.organizationId || req.user.organization;

    if (!title || !category || !clientId || !organizationId) {
        throw new apiError(400, "title, category, clientId, and organization are required");
    }
    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");
    if (client.organization?.toString() !== organizationId.toString()) {
        throw new apiError(400, "Client does not belong to this organization");
    }

    const workOrder = await WorkOrder.create({
        title,
        category,
        priority: priority || "regular",
        client: clientId,
        clientLocationId,
        organization: organizationId,
        createdBy: req.user._id,
        status: "created",
    });

    return res.status(201).json(new apiResponse(201, "Work Order Created Successfully", workOrder));
});

const getWorkOrderById = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const workOrder = await WorkOrder.findById(workOrderId)
        .populate("client", "name email phoneNumber")
        .populate("createdBy", "name email")
        .populate("parts.inventoryItem", "name sku price")
        .populate("attachments.uploadedBy", "name");
    if (!workOrder) throw new apiError(404, "Work Order not found");
    return res.status(200).json(new apiResponse(200, "Work Order Fetched Successfully", workOrder));
});

const updateWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const { title, category, priority } = req.body;
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");
    if (workOrder.status === "completed" || workOrder.status === "cancelled") {
        throw new apiError(400, "Cannot update a completed or cancelled work order");
    }
    if (title) workOrder.title = title;
    if (category) workOrder.category = category;
    if (priority) workOrder.priority = priority;
    await workOrder.save();
    return res.status(200).json(new apiResponse(200, "Work Order Updated Successfully", workOrder));
});

const deleteWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");
    await WorkOrderAssignment.deleteMany({ workOrder: workOrderId });
    await workOrder.deleteOne();
    return res.status(200).json(new apiResponse(200, "Work Order Deleted Successfully", {}));
});

const updateWorkOrderStatus = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const { status } = req.body;
    const validStatuses = ["created", "assigned", "in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) throw new apiError(400, "Invalid status");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");
    workOrder.status = status;
    await workOrder.save();

    const assignments = await WorkOrderAssignment.find({ workOrder: workOrderId });
    const workerIds = assignments.map(a => a.worker.toString());

    const orgManagers = await User.find({ 
        organization: workOrder.organization, 
        role: { $in: ["manager", "submanager"] } 
    });
    const managerIds = orgManagers.map(m => m._id.toString());

    // Combine unique user IDs to notify, excluding the current user
    const usersToNotify = [...new Set([...workerIds, ...managerIds])]
        .filter(id => id !== req.user._id.toString());

    if (usersToNotify.length > 0) {
        const notifications = usersToNotify.map(userId => ({
            user: userId,
            workOrder: workOrderId,
            type: "status_change",
            message: `Work order "${workOrder.title}" status changed to ${status} by ${req.user.name}`,
        }));
        await Notification.insertMany(notifications);
    }

    await AuditLog.create({
        worker: req.user._id,
        workOrder: workOrderId,
        notes: `Status changed to ${status} by ${req.user.name}`,
    });

    return res.status(200).json(new apiResponse(200, "Status Updated Successfully", workOrder));
});

const assignWorkOrderToWorker = asyncHandler(async (req, res) => {
    const { workOrderId, workerId } = req.body;
    if (!workOrderId || !workerId) throw new apiError(400, "Work Order ID and Worker ID are required");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const worker = await User.findById(workerId);
    if (!worker) throw new apiError(404, "Worker not found");
    if (!["technician", "contractor"].includes(worker.role)) {
        throw new apiError(400, "Only technicians and contractors can be assigned to work orders");
    }

    if (
        workOrder.organization.toString() !== worker.organization?.toString()
    ) {
        throw new apiError(400, "Worker does not belong to the same organization as this work order");
    }

    const existingAssignment = await WorkOrderAssignment.findOne({ workOrder: workOrderId, worker: workerId });
    if (existingAssignment) throw new apiError(400, "Worker is already assigned to this work order");

    const assignment = await WorkOrderAssignment.create({
        workOrder: workOrderId,
        worker: workerId,
        assignedBy: req.user._id,
    });

    workOrder.status = "assigned";
    await workOrder.save();

    await Notification.create({
        user: workerId,
        workOrder: workOrderId,
        type: "assignment",
        message: `You have been assigned to work order "${workOrder.title}"`,
    });

    return res.status(200).json(new apiResponse(200, "Worker Assigned Successfully", assignment));
});

const unassignWorkerFromWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId, workerId } = req.body;
    if (!workOrderId || !workerId) throw new apiError(400, "Work Order ID and Worker ID are required");

    const assignment = await WorkOrderAssignment.findOneAndDelete({ workOrder: workOrderId, worker: workerId });
    if (!assignment) throw new apiError(404, "Assignment not found");

    const remainingAssignments = await WorkOrderAssignment.countDocuments({ workOrder: workOrderId });
    if (remainingAssignments === 0) {
        await WorkOrder.findByIdAndUpdate(workOrderId, { status: "created" });
    }

    return res.status(200).json(new apiResponse(200, "Worker Unassigned Successfully", {}));
});

const getWorkOrderAssignments = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const assignments = await WorkOrderAssignment.find({ workOrder: workOrderId })
        .populate("worker", "name email role workerDetails")
        .populate("assignedBy", "name email");
    return res.status(200).json(new apiResponse(200, "Assignments Fetched Successfully", assignments));
});

const getMyWorkOrders = asyncHandler(async (req, res) => {
    const assignments = await WorkOrderAssignment.find({ worker: req.user._id })
        .populate({
            path: "workOrder",
            populate: [
                { path: "client", select: "name email phoneNumber" },
                { path: "parts.inventoryItem", select: "name sku price" },
            ],
        });
    const workOrders = assignments.map(a => a.workOrder).filter(Boolean);
    return res.status(200).json(new apiResponse(200, "My Work Orders Fetched Successfully", workOrders));
});

const addPartToWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const { inventoryItemId, quantity } = req.body;
    if (!inventoryItemId || !quantity) throw new apiError(400, "Inventory item and quantity are required");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const item = await InventoryItem.findById(inventoryItemId);
    if (!item) throw new apiError(404, "Inventory item not found");
    if (item.quantity < quantity) throw new apiError(400, "Insufficient inventory quantity");

    const existingPart = workOrder.parts.find(p => p.inventoryItem.toString() === inventoryItemId);
    if (existingPart) {
        existingPart.quantity += Number(quantity);
    } else {
        workOrder.parts.push({ inventoryItem: inventoryItemId, quantity });
    }

    item.quantity -= Number(quantity);
    await item.save();
    await workOrder.save();

    return res.status(200).json(new apiResponse(200, "Part Added Successfully", workOrder));
});

const removePartFromWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId, inventoryItemId } = req.params;
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const partIndex = workOrder.parts.findIndex(p => p.inventoryItem.toString() === inventoryItemId);
    if (partIndex === -1) throw new apiError(404, "Part not found in work order");

    const part = workOrder.parts[partIndex];
    const item = await InventoryItem.findById(inventoryItemId);
    if (item) {
        item.quantity += part.quantity;
        await item.save();
    }

    workOrder.parts.splice(partIndex, 1);
    await workOrder.save();
    return res.status(200).json(new apiResponse(200, "Part Removed Successfully", workOrder));
});

const returnPartFromWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const { inventoryItemId, quantity } = req.body;
    if (!inventoryItemId || !quantity) throw new apiError(400, "Inventory item and quantity are required");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const partIndex = workOrder.parts.findIndex(p => p.inventoryItem.toString() === inventoryItemId);
    if (partIndex === -1) throw new apiError(404, "Part not found in work order");

    const part = workOrder.parts[partIndex];
    const returnQty = Math.min(Number(quantity), part.quantity);

    const item = await InventoryItem.findById(inventoryItemId);
    if (item) {
        item.quantity += returnQty;
        await item.save();
    }

    if (returnQty >= part.quantity) {
        workOrder.parts.splice(partIndex, 1);
    } else {
        workOrder.parts[partIndex].quantity -= returnQty;
    }
    await workOrder.save();

    await Notification.create({
        user: req.user._id,
        workOrder: workOrderId,
        type: "part",
        message: `${req.user.name} returned ${returnQty}x ${item?.name || 'item'} to inventory`,
    });

    return res.status(200).json(new apiResponse(200, "Part Returned Successfully", workOrder));
});

const addAttachmentToWorkOrder = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    if (!req.file) throw new apiError(400, "Attachment file is required");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const uploaded = await fileUploader(req.file.path);
    workOrder.attachments.push({ fileUrl: uploaded.secure_url, uploadedBy: req.user._id });
    await workOrder.save();

    return res.status(200).json(new apiResponse(200, "Attachment Added Successfully", workOrder));
});

const getOrganizationWorkOrders = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, status, priority } = req.query;
    const filter = { organization: organizationId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [workOrders, total] = await Promise.all([
        WorkOrder.find(filter)
            .populate("client", "name email")
            .populate("createdBy", "name")
            .populate("parts.inventoryItem", "name sku")
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        WorkOrder.countDocuments(filter),
    ]);

    return res.status(200).json(new apiResponse(200, "Work Orders Fetched Successfully", {
        workOrders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getWorkOrderStats = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const statuses = ["created", "assigned", "in_progress", "completed", "cancelled"];
    const counts = await Promise.all(
        statuses.map(s => WorkOrder.countDocuments({ organization: organizationId, status: s }))
    );
    const stats = {};
    statuses.forEach((s, i) => (stats[s] = counts[i]));
    stats.total = counts.reduce((a, b) => a + b, 0);

    const now = new Date();
    const trend = [];
    for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const [weekTotal, weekCompleted] = await Promise.all([
            WorkOrder.countDocuments({ organization: organizationId, createdAt: { $lte: endDate } }),
            WorkOrder.countDocuments({ organization: organizationId, status: "completed", updatedAt: { $lte: endDate } })
        ]);
        trend.push({ month: `Week ${4 - i}`, Total: weekTotal, Completed: weekCompleted });
    }
    stats.trend = trend;

    return res.status(200).json(new apiResponse(200, "Work Order Stats Fetched Successfully", stats));
});

const getAllWorkOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const skip = (Number(page) - 1) * Number(limit);
    const [workOrders, total] = await Promise.all([
        WorkOrder.find(filter)
            .populate("organization", "name")
            .populate("client", "name")
            .populate("createdBy", "name")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        WorkOrder.countDocuments(filter)
    ]);
    return res.status(200).json(new apiResponse(200, "Work Orders Fetched Successfully", {
        workOrders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

export {
    createWorkOrder,
    getWorkOrderById,
    updateWorkOrder,
    deleteWorkOrder,
    updateWorkOrderStatus,
    assignWorkOrderToWorker,
    unassignWorkerFromWorkOrder,
    getWorkOrderAssignments,
    getMyWorkOrders,
    addPartToWorkOrder,
    removePartFromWorkOrder,
    returnPartFromWorkOrder,
    addAttachmentToWorkOrder,
    getOrganizationWorkOrders,
    getWorkOrderStats,
    getAllWorkOrders,
};
