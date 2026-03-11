
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";  


const paymentRouter = Router();

paymentRouter.route("/create-order").post(verifyJWT,createOrder); // Create Razorpay order route
paymentRouter.route("/verify-payment").post(verifyJWT,verifyPayment); // Verify Razorpay payment route

export {paymentRouter};