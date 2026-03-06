import { upload } from "../middlewares/multer.middleware.js";
import { loginUser, logoutUser, getUserProfile, generateOTP, verifyOTP, forgotPassword, verifyResetOTP, resetPassword } from "../controllers/user.controller.js";
import { createForm, getForm, getFormPublic, updateForm,fetchUserForms } from "../controllers/form.controller.js";
import { createResponse } from "../controllers/response.controller.js";
import { getResponses } from "../controllers/response.controller.js";

import Router from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import { uploadAttachment } from "../controllers/response.controller.js";
import { uploadFile } from "../controllers/upload.controller.js";


const router = Router();


router.route("/auth/generate-otp").post(generateOTP); // Generate OTP route
router.route("/auth/verify-otp").post(verifyOTP);     // Verify OTP route

router.route("/auth/forgot-password").post(forgotPassword); // Forgot password - send OTP
router.route("/auth/verify-reset-otp").post(verifyResetOTP); // Verify reset OTP
router.route("/auth/reset-password").post(resetPassword); // Reset password

router.route("/login").post(loginUser); // Login user route
router.route("/logout").post(verifyJWT,logoutUser); // Logout user route
router.route("/profile").get(verifyJWT,getUserProfile); // Get user profile route  

router.route("/create-form").post(verifyJWT,createForm); // Create form route
router.route("/form/:formId").get(verifyJWT, getForm); // Get form route (owner)
router.route("/form/:formId/public").get(getFormPublic); // Get form route (public, for filling)
router.route("/update/:formId").patch(verifyJWT, updateForm); // Update form route
router.route("/forms").get(verifyJWT,fetchUserForms); // Fetch user's forms route

router.route('/create-response/:formId').post(verifyJWT,createResponse); // Create response route
router.route('/form/:formId/responses').get(verifyJWT, getResponses); // Get form responses route



router.route("/upload").post(upload.single("file"), uploadFile); // Upload file to Cloudinary route
export {router};
