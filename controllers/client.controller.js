import { Client } from "../modals/Client.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const createClient = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, notes, locations } = req.body;
    const organizationId = req.body.organizationId || req.body.organization || req.user.organization;
    if (!name || !email || !phoneNumber || !organizationId) {
        throw new apiError(400, "Name, email, phone number, and organization are required");
    }
    const client = await Client.create({
        name,
        email,
        phoneNumber,
        notes,
        organization: organizationId,
        locations: locations || [],
    });
    return res.status(201).json(new apiResponse(201, "Client Created Successfully", client));
});

const getClientById = asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");
    return res.status(200).json(new apiResponse(200, "Client Fetched Successfully", client));
});

const updateClient = asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { name, email, phoneNumber, notes } = req.body;
    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");
    if (name) client.name = name;
    if (email) client.email = email;
    if (phoneNumber) client.phoneNumber = phoneNumber;
    if (notes !== undefined) client.notes = notes;
    await client.save();
    return res.status(200).json(new apiResponse(200, "Client Updated Successfully", client));
});

const deleteClient = asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");
    await client.deleteOne();
    return res.status(200).json(new apiResponse(200, "Client Deleted Successfully", {}));
});

const getClientsByOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [clients, total] = await Promise.all([
        Client.find({ organization: organizationId }).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        Client.countDocuments({ organization: organizationId }),
    ]);
    return res.status(200).json(new apiResponse(200, "Clients Fetched Successfully", {
        clients, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const addClientLocation = asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { address, city, state, postalCode, latitude, longitude } = req.body;
    if (!address || !city || !state || !postalCode) throw new apiError(400, "Address, city, state, and postal code are required");

    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");

    client.locations.push({ address, city, state, postalCode, latitude, longitude });
    await client.save();
    return res.status(200).json(new apiResponse(200, "Location Added Successfully", client));
});

const removeClientLocation = asyncHandler(async (req, res) => {
    const { clientId, locationId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) throw new apiError(404, "Client not found");

    const locIndex = client.locations.findIndex(l => l._id.toString() === locationId);
    if (locIndex === -1) throw new apiError(404, "Location not found");

    client.locations.splice(locIndex, 1);
    await client.save();
    return res.status(200).json(new apiResponse(200, "Location Removed Successfully", client));
});

export {
    createClient,
    getClientById,
    updateClient,
    deleteClient,
    getClientsByOrganization,
    addClientLocation,
    removeClientLocation,
};
