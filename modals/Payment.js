import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["credit_card", "bank_transfer", "cash", "other"],
            required: true,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
