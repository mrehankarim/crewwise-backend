import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
    {
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        workOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkOrder",
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["created", "assigned", "in_progress", "completed", "cancelled"],
            default: "created",
        },
    },
    { timestamps: true }
);

export const Schedule = mongoose.model("Schedule", scheduleSchema);
