import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const isManager = asyncHandler((req, res, next) => {
    if (req.user.role !== "manager") {
        throw new apiError(403, "Forbidden: Organization owner access required");
    }
    next();
});
