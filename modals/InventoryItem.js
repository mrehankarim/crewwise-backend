import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            maxlength: 100,
        },
        sku: {
            type: String,
            unique: true,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        price: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
