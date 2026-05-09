import { Attendance } from "../modals/Attendance.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const checkIn = asyncHandler(async (req, res) => {
    const { location } = req.body;
    if (!location) throw new apiError(400, "Location is required");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: today, $lt: tomorrow },
    });
    if (existing) throw new apiError(400, "Already checked in today");

    const now = new Date();
    const attendance = await Attendance.create({
        user: req.user._id,
        date: today,
        checkIn: now,
        location,
    });
    return res.status(201).json(new apiResponse(201, "Checked In Successfully", attendance));
});

const checkOut = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
        user: req.user._id,
        date: { $gte: today, $lt: tomorrow },
    });
    if (!attendance) throw new apiError(404, "No check-in record found for today");
    if (attendance.checkOut) throw new apiError(400, "Already checked out today");

    attendance.checkOut = new Date();
    await attendance.save();
    return res.status(200).json(new apiResponse(200, "Checked Out Successfully", attendance));
});

const getMyAttendance = asyncHandler(async (req, res) => {
    const { from, to, page = 1, limit = 30 } = req.query;
    const filter = { user: req.user._id };
    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
        Attendance.find(filter).skip(skip).limit(Number(limit)).sort({ date: -1 }),
        Attendance.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Attendance Fetched Successfully", {
        records, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getWorkerAttendance = asyncHandler(async (req, res) => {
    const { workerId } = req.params;
    const { from, to, page = 1, limit = 30 } = req.query;
    const filter = { user: workerId };
    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = new Date(from);
        if (to) filter.date.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
        Attendance.find(filter).skip(skip).limit(Number(limit)).sort({ date: -1 }),
        Attendance.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Worker Attendance Fetched Successfully", {
        records, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getOrganizationAttendance = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { date } = req.query;
    const { User } = await import("../modals/User.js");
    const workers = await User.find({ organization: organizationId }).select("_id");
    const workerIds = workers.map(w => w._id);

    const filter = { user: { $in: workerIds } };
    if (date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        filter.date = { $gte: d, $lt: next };
    }

    const records = await Attendance.find(filter)
        .populate("user", "name email role")
        .sort({ date: -1 });
    return res.status(200).json(new apiResponse(200, "Organization Attendance Fetched Successfully", records));
});

export { checkIn, checkOut, getMyAttendance, getWorkerAttendance, getOrganizationAttendance };
