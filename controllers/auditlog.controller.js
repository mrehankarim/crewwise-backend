import { AuditLog } from "../modals/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const createAuditLog = asyncHandler(async (req, res) => {
    const { workOrderId, notes } = req.body;
    if (!workOrderId) throw new apiError(400, "Work Order ID is required");
    const log = await AuditLog.create({
        worker: req.user._id,
        workOrder: workOrderId,
        notes,
    });
    return res.status(201).json(new apiResponse(201, "Audit Log Created Successfully", log));
});

const getWorkOrderAuditLogs = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const logs = await AuditLog.find({ workOrder: workOrderId })
        .populate("worker", "name email role")
        .sort({ createdAt: -1 });
    return res.status(200).json(new apiResponse(200, "Audit Logs Fetched Successfully", logs));
});

const getWorkerAuditLogs = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
        AuditLog.find({ worker: workerId })
            .populate("workOrder", "title status category")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        AuditLog.countDocuments({ worker: workerId }),
    ]);
    return res.status(200).json(new apiResponse(200, "Worker Audit Logs Fetched Successfully", {
        logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

export { createAuditLog, getWorkOrderAuditLogs, getWorkerAuditLogs };
