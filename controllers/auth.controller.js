import { User } from "../modals/User.js";
import { Subscription } from "../modals/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import emailValidationService from "../services/emailValidationService.js";
import phoneValidationService from "../services/phoneValidationService.js";

const ALLOWED_SELF_REGISTER_ROLES = ["admin", "manager", "technician", "contractor", "submanager"];

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phoneNumber, role } = req.body;

    if (!name || !email || !password || !role) {
        throw new apiError(400, "Name, email, password and role are required");
    }

    if (!ALLOWED_SELF_REGISTER_ROLES.includes(role)) {
        throw new apiError(400, `Role must be one of: ${ALLOWED_SELF_REGISTER_ROLES.join(", ")}`);
    }

    if (!emailValidationService(email)) {
        throw new apiError(400, "Invalid email format");
    }

    if (phoneNumber) {
        const validatePhone = phoneValidationService.validate(phoneNumber);
        if (!validatePhone.valid) throw new apiError(400, validatePhone.message);
    }

    const userExists = await User.findOne({ email });
    if (userExists) throw new apiError(400, "An account with this email already exists");

    const normalizedPhone = phoneNumber
        ? phoneValidationService.validate(phoneNumber).phone
        : undefined;

    const user = await User.create({
        name,
        email,
        password,
        phoneNumber: normalizedPhone,
        role,
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(new apiResponse(201, "Registration Successful", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) throw new apiError(400, "Email and password are required");
    if (!emailValidationService(email)) throw new apiError(400, "Invalid email format");

    const user = await User.findOne({ email });
    if (!user) throw new apiError(401, "Invalid email or password");

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) throw new apiError(401, "Invalid email or password");

    if (!user.isActive) throw new apiError(403, "Your account has been deactivated");

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        .populate("organization", "name industry location");

    let subscriptionStatus = null;
    if (user.role !== "admin" && user.organization) {
        const activeSubscription = await Subscription.findOne({
            organization: user.organization,
            isActive: true,
            endDate: { $gt: new Date() },
        }).populate("plan");

        subscriptionStatus = activeSubscription
            ? { active: true, plan: activeSubscription.plan, expiresAt: activeSubscription.endDate }
            : { active: false, message: "Payment required. Please purchase a plan to access software features." };
    } else if (user.role !== "admin" && !user.organization) {
        subscriptionStatus = { active: false, message: "No organization found. Please create an organization and subscribe to a plan." };
    }

    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
    return res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new apiResponse(200, "Login Successful", { user: loggedInUser, accessToken, subscriptionStatus }));
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" }, { new: true });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };
    return res.status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new apiResponse(200, "Logged Out Successfully", {}));
});

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select("-password -refreshToken")
        .populate("organization", "name industry location")
        .populate("workerDetails.skills", "name")
        .populate("workerDetails.manager", "name email role")
        .populate("managerDetails.managedWorkers", "name email role workerDetails.status")
        .populate("managerDetails.subManagers", "name email")
        .populate("addedBy", "name email role");
    let subscriptionStatus = null;
    if (user.role !== "admin" && user.organization) {
        const activeSubscription = await Subscription.findOne({
            organization: user.organization._id,
            isActive: true,
            endDate: { $gt: new Date() },
        }).populate("plan");

        subscriptionStatus = activeSubscription
            ? { active: true, plan: activeSubscription.plan, expiresAt: activeSubscription.endDate }
            : { active: false, message: "Payment required. Please purchase a plan to access software features." };
    }

    return res.status(200).json(new apiResponse(200, "Profile Fetched Successfully", { user, subscriptionStatus }));
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, phoneNumber, location, workerDetails } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (location) user.location = location;
    if (phoneNumber) {
        const validated = phoneValidationService.validate(phoneNumber);
        if (!validated.valid) throw new apiError(400, validated.message);
        user.phoneNumber = validated.phone;
    }
    if (workerDetails && ["technician", "contractor"].includes(user.role)) {
        if (workerDetails.designation) user.workerDetails.designation = workerDetails.designation;
        if (workerDetails.category) user.workerDetails.category = workerDetails.category;
    }

    await user.save({ validateBeforeSave: false });
    const updated = await User.findById(user._id).select("-password -refreshToken");
    return res.status(200).json(new apiResponse(200, "Profile Updated Successfully", updated));
});

const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new apiError(400, "Both current and new passwords are required");
    if (newPassword.length < 6) throw new apiError(400, "New password must be at least 6 characters");

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) throw new apiError(400, "Current password is incorrect");

    user.password = newPassword;
    // Clear temp password — user has now set their own password
    await User.findByIdAndUpdate(user._id, { tempPassword: null });
    await user.save();
    return res.status(200).json(new apiResponse(200, "Password Changed Successfully", {}));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, organizationId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (role) filter.role = role;
    if (organizationId) filter.organization = organizationId;
    const [users, total] = await Promise.all([
        User.find(filter).select("-password -refreshToken")
            .populate("organization", "name")
            .skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
        User.countDocuments(filter),
    ]);
    return res.status(200).json(new apiResponse(200, "Users Fetched Successfully", {
        users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)),
    }));
});

const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password -refreshToken")
        .populate("organization", "name industry")
        .populate("workerDetails.skills", "name")
        .populate("workerDetails.manager", "name email")
        .populate("addedBy", "name email role");
    if (!user) throw new apiError(404, "User not found");
    return res.status(200).json(new apiResponse(200, "User Fetched Successfully", user));
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ["manager", "submanager", "technician", "contractor"];
    if (!validRoles.includes(role)) throw new apiError(400, `Role must be one of: ${validRoles.join(", ")}`);

    const user = await User.findById(userId);
    if (!user) throw new apiError(404, "User not found");
    if (user.role === "admin") throw new apiError(403, "Cannot change the role of another admin");

    user.role = role;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new apiResponse(200, "User Role Updated Successfully", { _id: user._id, role: user.role }));
});

const toggleUserActive = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) throw new apiError(404, "User not found");
    if (user.role === "admin") throw new apiError(403, "Cannot deactivate an admin account");
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new apiResponse(200, `User ${user.isActive ? "Activated" : "Deactivated"} Successfully`, {
        _id: user._id, isActive: user.isActive,
    }));
});

export {
    registerUser,
    loginUser,
    logOutUser,
    getMe,
    updateProfile,
    changePassword,
    getAllUsers,
    getUserById,
    updateUserRole,
    toggleUserActive,
};