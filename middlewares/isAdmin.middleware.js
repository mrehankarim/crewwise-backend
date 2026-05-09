import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const isAdmin = asyncHandler((req, res, next) => {
    if (req.user.role !== "admin") {
        throw new apiError(403, "Forbidden: SaaS Admin access required");
    }
    next();
});
