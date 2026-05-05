export const isAdmin = asyncHandler((req, res, next) => {

    if (req.user.role !== "admin") {
        throw new apiError(403, "Forbidden: Insufficient permissions");
    }
    next();
})
