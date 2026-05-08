import { User } from "../modals/User.js";
import asyncHandler from "../utils/asyncHandler.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import emailValidationService from "../services/emailValidationService.js"
import phoneValidationService from "../services/phoneValidationService.js"

const registerUser = asyncHandler(async (req, res) => {

    const { name, email, password, phoneNumber, role } = req.body;
    if ([name, email, password, phoneNumber, role].some((field) => field === "")) {
        throw new apiError(400, "All fields are required");
    }
    if (!emailValidationService(email)) {
        throw new apiError(400, "Invalid email");
    }
    const validatePhone = phoneValidationService.validate(phoneNumber);
    if (!validatePhone.valid) {
        throw new apiError(400, validatePhone.message);
    }
    const normalizedPhone = validatePhone.phone;
    console.log(normalizedPhone);

    const userExists = await User.findOne({ email })
    if (userExists) {
        throw new apiError(400, "User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        phoneNumber: normalizedPhone,
        role,
    })

    const createdUser = await User.findById(user._id).select("-password");

    return res.status(200).json(
        new apiResponse(200, "User Registered Successfully", createdUser)
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new apiError(400, "All fields are required");
    }

    if (!emailValidationService(email)) {
        throw new apiError(400, "Invalid email");
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new apiError(400, "User not found");
    }
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
        throw new apiError(400, "Invalid password");
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken: refreshToken }, { new: true });
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,

    }
    return res.status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new apiResponse(200, "User Logged In Successfully", loggedInUser)
        )
})


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { refreshToken: "" },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(
            new apiResponse(200, "User Logged Out Successfully", {})
        )
})
export {
    registerUser,
    loginUser,
    logOutUser
}