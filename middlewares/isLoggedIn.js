import { User } from "../modals/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";

export const isLoggedIn = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        const refreshToken = req.cookies?.refreshToken;

        if (!accessToken && !refreshToken) {
            throw new apiError(401, "Unauthorized request");
        }

        if (accessToken) {
            try {
                const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                const user = await User.findById(decodedToken._id).select("-password -refreshToken");
                if (user) {
                    req.user = user;
                    return next();
                }
            } catch (error) {
                throw new apiError(401, error?.message || "Unauthorized request");
            }
        }

        if (!refreshToken) {
            throw new apiError(401, "Unauthorized request");
        }

        const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedRefreshToken._id).select("-password");

        if (!user || user.refreshToken !== refreshToken) {
            throw new apiError(401, "Refresh token is invalid or expired");
        }

        const newAccessToken = await user.generateAccessToken();
        const newRefreshToken = await user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true,
        };

        res.cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options);

        req.user = user;
        next();

    } catch (error) {
        next(new apiError(401, error?.message || "Unauthorized request"));
    }
});