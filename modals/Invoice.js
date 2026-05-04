import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },
    },
    { timestamps: { createdAt: "issuedAt", updatedAt: false } }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
