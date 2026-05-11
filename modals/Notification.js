import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        workOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkOrder",
        },
        type: {
            type: String,
            enum: ["assignment", "status_change", "schedule", "part", "general"],
            default: "general",
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model("Notification", notificationSchema);

