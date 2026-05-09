import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const isWorker = asyncHandler((req, res, next) => {
    if (!["technician", "contractor"].includes(req.user.role)) {
        throw new apiError(403, "Forbidden: Technician or contractor access required");
    }
    next();
});
