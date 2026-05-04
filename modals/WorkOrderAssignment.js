import mongoose from "mongoose";

const workOrderAssignmentSchema = new mongoose.Schema(
    {
        workOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkOrder",
            required: true,
        },
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: { createdAt: "assignedAt", updatedAt: false } }
);

export const WorkOrderAssignment = mongoose.model("WorkOrderAssignment", workOrderAssignmentSchema);
