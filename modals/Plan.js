import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100,
    },
    price: {
        type: Number,
        required: true,
        min: [1, "Plan price must be at least $1. Free plans are not available."],
    },
    maxWorkOrders: {
        type: Number,
        required: true,
    },
    maxUsers: {
        type: Number,
        required: true,
    },
    // Duration in days (default 30)
    duration: {
        type: Number,
        default: 30,
    },
});

export const Plan = mongoose.model("Plan", planSchema);
