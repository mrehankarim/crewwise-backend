import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
        tempPassword: {
            type: String,
            default: null,
            select: false,
        },
        phoneNumber: {
            type: String,
        },
        profilePictureUrl: {
            type: String,
        },
        location: {
            type: String,
        },
        role: {
            type: String,
            enum: ["admin", "manager", "submanager", "technician", "contractor"],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        managerDetails: {
            subManagers: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
            managedWorkers: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
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
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
            role: this.role,
            organization: this.organization,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = async function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);