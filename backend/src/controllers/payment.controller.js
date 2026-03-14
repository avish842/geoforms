import { getRazorpayInstance } from "../config/razorpay.config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Plan} from "../models/plan.model.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { getEntitlementForUser, getExpiryFromInterval, getPlanTier, normalizeUserPlan } from "../services/subscription.service.js";




const createOrder =asyncHandler(async (req, res) => {

        const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const {planId} = req.body;
    const planDetails = await Plan.findById(planId);
    if(!planDetails) {
        return res.status(404).json({message: "Plan not found"});
    }

    const amount = planDetails.price;
    console.log("Plan amount:", amount);

    console.log("User ID:", userId);
    console.log("Plan ID:", planId);

    const entitlement = await getEntitlementForUser(userId);
    const currentTier = getPlanTier(entitlement?.plan?.name || req.user?.plan);
    const requestedTier = getPlanTier(planDetails?.name);

    if (currentTier > requestedTier) {
        return res.status(400).json({
            success: false,
            message: "You already have a better active plan. Downgrade purchase is not allowed.",
        });
    }


    // check if user already has an active subscription
    const activeSubscription = await Subscription.findOne({ userId: userId, status: "success", planId: planId, expiresAt: { $gt: new Date() } });
    if(activeSubscription){
        return res.status(400).json({ message: "You have already subscribed to this plan" });
    }

    const options = {
        amount: amount * 100, // amount in paise
        currency: planDetails.currency || "INR",
        receipt: `rcpt_${Date.now()}`,
    };

    console.log(options)

    try {
        const order = await getRazorpayInstance().orders.create(options);

        await Subscription.create({
            userId,
            planId,
            amount,
            currency: planDetails.currency || "INR",
            status: "pending",
            gateway: "razorpay",
            transactionId: order.id,
        });

        return res.status(200).json({
            success: true,
            data: order,
            message: "Order created successfully",
        });
    } catch(error){
        console.error("Create order failed:", error);
        return res.status(500).json({
            success:false,
            message: error?.error?.description || error?.message || "Something went wrong",
        });
    }
});

const verifyPayment =asyncHandler(async (req,res)=>{

    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Payment verification payload is incomplete");
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 
    const pendingSubscription = await Subscription.findOne({
        transactionId: razorpay_order_id,
        userId,
        status: "pending",
    }).populate("planId");

    if (!pendingSubscription) {
        const existingSuccess = await Subscription.findOne({
            transactionId: razorpay_order_id,
            userId,
            status: "success",
        });

        if (existingSuccess) {
            return res.status(200).json({
                success: true,
                message: "Payment already verified",
            });
        }

        throw new ApiError(404, "Pending payment record not found");
    }

    const razorpayOrder = await getRazorpayInstance().orders.fetch(razorpay_order_id);
    const expectedAmountInSubunits = pendingSubscription.amount * 100;
    const expectedCurrency = pendingSubscription.currency || "INR";

    if (
        Number(razorpayOrder.amount) !== Number(expectedAmountInSubunits) ||
        String(razorpayOrder.currency).toUpperCase() !== String(expectedCurrency).toUpperCase()
    ) {
        await Subscription.findByIdAndUpdate(pendingSubscription._id, { status: "failed" });
        throw new ApiError(400, "Order amount/currency mismatch");
    }


    // create signature using order_id and payment_id and secret key
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    const generatedBuffer = Buffer.from(generated_signature);
    const receivedBuffer = Buffer.from(razorpay_signature);
    const isSignatureValid =
        generatedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if(isSignatureValid){

        const startsAt = new Date();
        const expiresAt = getExpiryFromInterval(pendingSubscription.planId?.interval, startsAt);

        // Update subscription record to success
        await Subscription.findOneAndUpdate(
            { _id: pendingSubscription._id, status: "pending" },
            {
                status: "success",
                startedAt: startsAt,
                expiresAt,
            },
            { new: true }
        );

        const normalizedPlan = normalizeUserPlan(pendingSubscription.planId?.name);

        await User.findByIdAndUpdate(userId, {
            isPaidUser: true,
            plan: normalizedPlan,
            $push: {
                paymentHistory: {
                    paymentId: razorpay_payment_id,
                    amount: pendingSubscription.amount,
                    plan: normalizedPlan,
                    gateway: "razorpay",
                    status: "success",
                    createdAt: startsAt,
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });
    }
    else{
        await Subscription.findByIdAndUpdate(pendingSubscription._id, { status: "failed" });
        return res.status(400).json({
            success: false,
            message: "Payment verification failed"
        });
    }
});

export {createOrder, verifyPayment};