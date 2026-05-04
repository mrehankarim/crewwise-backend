import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50,
    },
});

export const Skill = mongoose.model("Skill", skillSchema);
