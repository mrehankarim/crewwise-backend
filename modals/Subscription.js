import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
