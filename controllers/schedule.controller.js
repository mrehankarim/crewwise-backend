import { Schedule } from "../modals/Schedule.js";
import { WorkOrder } from "../modals/WorkOrder.js";
import { User } from "../modals/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const createSchedule = asyncHandler(async (req, res) => {
    const { workerId, workOrderId, startTime, endTime } = req.body;
    if (!workerId || !workOrderId || !startTime || !endTime) {
        throw new apiError(400, "All fields are required");
    }
    const worker = await User.findById(workerId);
    if (!worker) throw new apiError(404, "Worker not found");
    if (!["technician", "contractor"].includes(worker.role)) throw new apiError(400, "User is not a worker");

    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) throw new apiError(404, "Work Order not found");

    const conflict = await Schedule.findOne({
        worker: workerId,
        status: { $in: ["created", "assigned", "in_progress"] },
        $or: [
            { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
        ],
    });
    if (conflict) throw new apiError(400, "Worker has a scheduling conflict during this time");

    const schedule = await Schedule.create({ worker: workerId, workOrder: workOrderId, startTime, endTime });
    return res.status(201).json(new apiResponse(201, "Schedule Created Successfully", schedule));
});

const getScheduleById = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId)
        .populate("worker", "name email role")
        .populate("workOrder", "title category status");
    if (!schedule) throw new apiError(404, "Schedule not found");
    return res.status(200).json(new apiResponse(200, "Schedule Fetched Successfully", schedule));
});

const updateSchedule = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const { startTime, endTime, status } = req.body;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new apiError(404, "Schedule not found");
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (status) schedule.status = status;
    await schedule.save();
    return res.status(200).json(new apiResponse(200, "Schedule Updated Successfully", schedule));
});

const deleteSchedule = asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) throw new apiError(404, "Schedule not found");
    await schedule.deleteOne();
    return res.status(200).json(new apiResponse(200, "Schedule Deleted Successfully", {}));
});

const getWorkerSchedules = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { from, to } = req.query;
    const filter = { worker: workerId };
    if (from || to) {
        filter.startTime = {};
        if (from) filter.startTime.$gte = new Date(from);
        if (to) filter.startTime.$lte = new Date(to);
    }
    const schedules = await Schedule.find(filter)
        .populate("workOrder", "title category status priority")
        .sort({ startTime: 1 });
    return res.status(200).json(new apiResponse(200, "Worker Schedules Fetched Successfully", schedules));
});

const getMySchedules = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const filter = { worker: req.user._id };
    if (from || to) {
        filter.startTime = {};
        if (from) filter.startTime.$gte = new Date(from);
        if (to) filter.startTime.$lte = new Date(to);
    }
    const schedules = await Schedule.find(filter)
        .populate("workOrder", "title category status priority client")
        .sort({ startTime: 1 });
    return res.status(200).json(new apiResponse(200, "My Schedules Fetched Successfully", schedules));
});

const getWorkOrderSchedules = asyncHandler(async (req, res) => {
    const { workOrderId } = req.params;
    const schedules = await Schedule.find({ workOrder: workOrderId })
        .populate("worker", "name email role");
    return res.status(200).json(new apiResponse(200, "Work Order Schedules Fetched Successfully", schedules));
});

export {
    createSchedule,
    getScheduleById,
    updateSchedule,
    deleteSchedule,
    getWorkerSchedules,
    getMySchedules,
    getWorkOrderSchedules,
};
