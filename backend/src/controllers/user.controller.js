import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError }  from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendOTPEmail } from "../utils/SendOTP.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";



const generateAccessAndRefreshTokens=async(userId)=>{

      try {
        const user=await User.findById(userId);
        const accessToken=await user.generateAccessToken(); // Generate access token using the user's method
        const refreshToken=await user.generateRefreshToken(); // Generate refresh token using the user's method

        user.refreshToken =refreshToken; // Store the refresh token in the user document

        await user.save({
            validateBeforeSave: false // Skip validation before saving the user document {no need to validate all fields when only updating the refresh token}
        })
        return { accessToken, refreshToken };
        

        
    } catch (error) {
        console.error("Error generating access and refresh tokens:", error);
        throw new ApiError(500, "Internal server error while generating tokens");
        
    }



}
const generateOTP=asyncHandler(async(req,res)=>{
    const {fullName, username, email, password} = req.body;

    if([fullName, username, email, password].some((field) => !field || field.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    // Check if a verified user already exists with this email or username
    const existingVerified = await User.findOne({
        $or: [{email, isEmailVerified: true}, {username: username.toLowerCase().trim(), isEmailVerified: true}]
    });
    if(existingVerified){
        throw new ApiError(400, "User already exists with this email or username");
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Check if an unverified user already exists with this email (resend case)
    let user = await User.findOne({email, isEmailVerified: false});

    if(user){
        // Update existing unverified user
        user.fullName = fullName;
        user.username = username.toLowerCase().trim();
        user.password = password;
        user.emailOtp = otp;
        user.emailOtpExpiry = otpExpiry;
        await user.save();
    } else {
        // Check username conflict with unverified users too
        const usernameConflict = await User.findOne({username: username.toLowerCase().trim()});
        if(usernameConflict){
            throw new ApiError(400, "Username is already taken");
        }

        user = await User.create({
            fullName,
            email,
            username: username.toLowerCase().trim(),
            password,
            isEmailVerified: false,
            emailOtp: otp,
            emailOtpExpiry: otpExpiry,
        });
    }

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return res.status(200).json(
        new ApiResponse(200, {email}, "OTP sent successfully. Please verify your email.")
    );
});

const verifyOTP=asyncHandler(async(req,res)=>{
    const {email, otp} = req.body;

    if(!email || !otp){
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({email, isEmailVerified: false});
    if(!user){
        throw new ApiError(404, "No pending verification found for this email");
    }

    // Check OTP expiry
    if(user.emailOtpExpiry < new Date()){
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    // Check OTP match
    if(user.emailOtp !== otp){
        throw new ApiError(400, "Invalid OTP");
    }

    // Mark email as verified and clear OTP fields
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save({validateBeforeSave: false});

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const verifiedUser = await User.findById(user._id).select("-password -refreshToken -emailOtp -emailOtpExpiry");

    const Options = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }; 

    return res.status(201)
        .cookie("refreshToken", refreshToken, Options)
        .cookie("accessToken", accessToken, Options)
        .json(
            new ApiResponse(201, {
                user: verifiedUser,
                accessToken,
                refreshToken
            }, "Email verified & user registered successfully")
        );
});


const loginUser=asyncHandler(async(req,res)=>{
    // To be implemented
    const {username, email,password}=req.body;

    if(!username&&!email){
        throw new ApiError(400, "Username or email is required to login");
    }
    if(!password||password.trim()===""){
        throw new ApiError(400, "Password is required to login");
    }
    const user = await User.findOne({$or:[{email},{username}]});
    if(!user){
        throw new ApiError(404, "User not found");
    }
    const isPasswordMatch=await user.isPasswordCorrect(password);
    if(!isPasswordMatch){
        throw new ApiError(401, "Invalid password");
    }
    
    const userId=user._id;
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(userId);
    const loggedInUsers=await User.findById(userId).select("-password -refreshToken");

    const Options={
        httpOnly:true,
        secure:true,
        sameSite:"none",
    }
    res.status(200)
    .cookie("refreshToken",refreshToken,Options)// Set the refresh token in an HTTP-only se
    .cookie("accessToken",accessToken,Options)// Set the access token in an HTTP-only secure cookie
    .json(
        new ApiResponse(200,
            {
                user:loggedInUsers,
                accessToken,
                refreshToken
            }
            ,"User logged in successfully")
    )
        
});

const logoutUser=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found");
    }
    user.refreshToken = null;
    await user.save({
        validateBeforeSave: false
    });

    const Options={
        httpOnly:true,
        secure:true,
        sameSite:"none",
    }

    res.status(200)
    .clearCookie("refreshToken",Options)
    .clearCookie("accessToken",Options)
    .json(
        new ApiResponse(200,null,"User logged out successfully")
    );
});

const getUserProfile=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    const user=await User.findById(userId).select("-password -refreshToken");
    if(!user){
        throw new ApiError(404,"User not found");
    }

    res.status(200).json(
        new ApiResponse(200,user,"User profile fetched successfully")
    )

});
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email || email.trim() === "") {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email, isEmailVerified: true });
    if (!user) {
        throw new ApiError(404, "No account found with this email");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(email, otp);

    return res.status(200).json(
        new ApiResponse(200, { email }, "Password reset OTP sent successfully")
    );
});

const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email, isEmailVerified: true });
    if (!user) {
        throw new ApiError(404, "No account found with this email");
    }

    if (!user.passwordResetOtp || user.passwordResetOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    if (user.passwordResetOtp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    return res.status(200).json(
        new ApiResponse(200, { email, verified: true }, "OTP verified successfully")
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, OTP, and new password are required");
    }

    if (newPassword.trim().length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const user = await User.findOne({ email, isEmailVerified: true });
    if (!user) {
        throw new ApiError(404, "No account found with this email");
    }

    if (!user.passwordResetOtp || user.passwordResetOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    if (user.passwordResetOtp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset successfully")
    );
});

export { loginUser, logoutUser, getUserProfile, generateOTP, verifyOTP, forgotPassword, verifyResetOTP, resetPassword };
