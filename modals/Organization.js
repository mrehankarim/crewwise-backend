import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        about: {
            type: String,
        },
        industry: {
            type: String,
            maxlength: 50,
        },
        location: {
            type: String,
            maxlength: 150,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);