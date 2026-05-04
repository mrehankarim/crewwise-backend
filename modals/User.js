import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        profilePictureUrl: {
            type: String,
        },
        location: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "contractor", "technician", "manager"],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },

        // Organization this user belongs to (null for admins)
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
        },

        // ── Manager-specific fields ──────────────────────────────
        managerDetails: {
            managedWorkers: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },

        // ── Technician / Contractor-specific fields ──────────────
        workerDetails: {
            designation: {
                type: String,
                minlength: 3,
                maxlength: 100,
            },
            category: {
                type: String,
            },
            salary: {
                type: Number,
            },
            manager: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            skills: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Skill",
                },
            ],
            status: {
                type: String,
                enum: ["active", "inactive", "on_leave"],
                default: "inactive",
            },
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);