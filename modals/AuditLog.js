import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
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
        notes: {
            type: String,
            maxlength: 150,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
