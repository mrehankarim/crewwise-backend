import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
        },
        location: {
            type: String,
            required: true,
            maxlength: 150,
        },
    },
    { timestamps: true }
);

export const Attendance = mongoose.model("Attendance", attendanceSchema);
