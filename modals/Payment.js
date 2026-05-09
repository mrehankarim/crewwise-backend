import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
        },
        paymentMethod: {
            type: String,
            enum: ["paypal", "credit_card", "bank_transfer", "cash", "other"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
        },
        paypalOrderId: {
            type: String,
        },
        paypalCaptureId: {
            type: String,
        },
        paymentDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
