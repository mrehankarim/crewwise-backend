import mongoose from "mongoose";

// ClientLocation is embedded directly inside Client (no separate collection needed)
const clientLocationSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        maxlength: 100,
    },
    city: {
        type: String,
        required: true,
        maxlength: 50,
    },
    state: {
        type: String,
        required: true,
        maxlength: 50,
    },
    postalCode: {
        type: String,
        required: true,
        maxlength: 10,
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
});

const clientSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        name: {
            type: String,
            required: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            maxlength: 100,
        },
        phoneNumber: {
            type: String,
            required: true,
            maxlength: 20,
        },
        notes: {
            type: String,
            maxlength: 150,
        },
        // All locations for this client (embedded)
        locations: [clientLocationSchema],
    },
    { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);
