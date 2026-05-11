import mongoose from "mongoose";

const workOrderPartSchema = new mongoose.Schema({
    inventoryItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
});

const workOrderAttachmentSchema = new mongoose.Schema(
    {
        fileUrl: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: { createdAt: "uploadedAt", updatedAt: false } }
);

const workOrderSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },
        clientLocationId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        title: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 150,
        },
        category: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 50,
        },
        priority: {
            type: String,
            enum: ["regular", "urgent", "emergency"],
            default: "regular",
        },
        status: {
            type: String,
            enum: ["created", "assigned", "in_progress", "completed", "cancelled"],
            default: "created",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        parts: [workOrderPartSchema],
        attachments: [workOrderAttachmentSchema],
    },
    { timestamps: true }
);

export const WorkOrder = mongoose.model("WorkOrder", workOrderSchema);
