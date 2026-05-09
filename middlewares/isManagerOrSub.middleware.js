import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const isManagerOrSub = asyncHandler((req, res, next) => {
    if (!["manager", "submanager"].includes(req.user.role)) {
        throw new apiError(403, "Forbidden: Manager or sub-manager access required");
    }
    next();
});
