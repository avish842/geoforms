import { getRazorpayInstance } from "../config/razorpay.config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Plan} from "../models/plan.model.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";





const createOrder =asyncHandler(async (req, res) => {

    const {planId} = req.body;
    const planDetails = await Plan.findById(planId);
    if(!planDetails) {
        return res.status(404).json({message: "Plan not found"});
    }

    const amount = planDetails.price;
    console.log("Plan amount:", amount);
    

    const options = {
        amount: amount * 100, // amount in paise
        currency: "INR",
        receipt: planId,
    };

    try {
        getRazorpayInstance().orders.create(options, (err, order) => {
            if (err) {
                console.error("Razorpay order creation failed:", err);
                return res.status(500).json({ message: "Failed to create order" });
            }

            return res.status(200).json({
                success: true,
                data: order
            });

        })
    }
    catch(error){
        return res.status(500).json({
            succes:false,
            message:"Somthing went wrong",
        });
    }
});

const verifyPayment =asyncHandler(async (req,res)=>{

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

    // create signature using order_id and payment_id and secret key
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if(generated_signature === razorpay_signature){
        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });
    }
    else{
        return res.status(400).json({
            success: false,
            message: "Payment verification failed"
        });
    }
});

export {createOrder, verifyPayment};