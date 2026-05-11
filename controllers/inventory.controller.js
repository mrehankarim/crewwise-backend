import { User } from "../modals/User.js";
import { InventoryItem } from "../modals/InventoryItem.js";
import { WorkOrder } from "../modals/WorkOrder.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { Organization } from "../modals/Organization.js";

const createInventoryItem = asyncHandler(async (req, res) => {
    const { name, sku, quantity, price } = req.body;
    const organizationId = req.body.organizationId || req.body.organization || req.user.organization;
    if (!name || !sku || !quantity || !price || !organizationId) {
        throw new apiError(400, "All fields are required");
    }
    const inventoryItem = await InventoryItem.create({
        name,
        sku,
        quantity,
        price,
        organization: organizationId,
    })
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Created Successfully", inventoryItem)
    )
})

const getInventoryItems = asyncHandler(async (req, res) => {
    const inventoryItems = await InventoryItem.find();
    return res.status(200).json(
        new apiResponse(200, "Inventory Items Fetched Successfully", inventoryItems)
    )
})

const getInventoryItemById = asyncHandler(async (req, res) => {
    const { inventoryItemId } = req.params;
    if (!inventoryItemId) {
        throw new apiError(400, "Inventory Item ID is required");
    }
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(404, "Inventory Item not found");
    }
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Fetched Successfully", inventoryItem)
    )
})

const updateInventoryItem = asyncHandler(async (req, res) => {
    const { inventoryItemId } = req.params;
    const { name, sku, quantity, price } = req.body;
    if (!inventoryItemId) {
        throw new apiError(400, "Inventory Item ID is required");
    }
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(404, "Inventory Item not found");
    }
    inventoryItem.name = name;
    inventoryItem.sku = sku;
    inventoryItem.quantity = quantity;
    inventoryItem.price = price;
    await inventoryItem.save();
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Updated Successfully", inventoryItem)
    )
})

const deleteInventoryItem = asyncHandler(async (req, res) => {
    const { inventoryItemId } = req.params;
    if (!inventoryItemId) {
        throw new apiError(400, "Inventory Item ID is required");
    }
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(404, "Inventory Item not found");
    }
    await inventoryItem.deleteOne();
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Deleted Successfully", inventoryItem)
    )
})

const assignInverntoryItemToWorkOrder = asyncHandler(async (req, res) => {
    const { inventoryItemId, workOrderId } = req.params;
    if (!inventoryItemId || !workOrderId) {
        throw new apiError(400, "Inventory Item ID and Work Order ID are required");
    }
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(404, "Inventory Item not found");
    }
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
        throw new apiError(404, "Work Order not found");
    }
    workOrder.parts.push({
        inventoryItem: inventoryItem._id,
        quantity: 1,
    })
    await workOrder.save();
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Assigned Successfully", workOrder)
    )
})

const deassignInventoryItemFromWorkOrder = asyncHandler(async (req, res) => {
    const { inventoryItemId, workOrderId } = req.params;
    if (!inventoryItemId || !workOrderId) {
        throw new apiError(400, "Inventory Item ID and Work Order ID are required");
    }
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
        throw new apiError(404, "Inventory Item not found");
    }
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder) {
        throw new apiError(404, "Work Order not found");
    }
    workOrder.parts.pull({ inventoryItem: inventoryItemId });
    await workOrder.save();
    return res.status(200).json(
        new apiResponse(200, "Inventory Item Deassigned Successfully", workOrder)
    )
})

const getInventoryItemsByOrganization = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        InventoryItem.find({ organization: organizationId }).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        InventoryItem.countDocuments({ organization: organizationId }),
    ]);
    return res.status(200).json(new apiResponse(200, "Inventory Items Fetched Successfully", {
        items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

export {
    createInventoryItem,
    getInventoryItems,
    getInventoryItemById,
    updateInventoryItem,
    deleteInventoryItem,
    assignInverntoryItemToWorkOrder,
    deassignInventoryItemFromWorkOrder,
    getInventoryItemsByOrganization,
}