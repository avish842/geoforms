import { upload } from "../middlewares/multer.middleware.js";
import { loginUser, logoutUser, getUserProfile, generateOTP, verifyOTP } from "../controllers/user.controller.js";
import { createForm, getForm, getFormPublic, updateForm } from "../controllers/form.controller.js";
import { createResponse } from "../controllers/response.controller.js";

import Router from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";


const router = Router();


router.route("/auth/generate-otp").post(generateOTP); // Generate OTP route
router.route("/auth/verify-otp").post(verifyOTP);     // Verify OTP route

router.route("/login").post(loginUser); // Login user route
router.route("/logout").post(verifyJWT,logoutUser); // Logout user route
router.route("/profile").get(verifyJWT,getUserProfile); // Get user profile route  

router.route("/create-form").post(verifyJWT,createForm); // Create form route
router.route("/form/:formId").get(verifyJWT, getForm); // Get form route (owner)
router.route("/form/:formId/public").get(getFormPublic); // Get form route (public, for filling)
router.route("/update/:formId").patch(verifyJWT, updateForm); // Update form route

router.route('/create-response/:formId').post(verifyJWT,createResponse); // Create response route

export {router};
