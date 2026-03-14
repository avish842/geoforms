import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    gateway: {
      type: String, // cashfree, razorpay, stripe
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true, // idempotency support
    },

    referralCodeUsed: {
      type: String,
      default: null,
    },

    startedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ userId: 1, status: 1, expiresAt: -1 });
subscriptionSchema.index({ userId: 1, planId: 1, status: 1, expiresAt: -1 });

const Subscription = mongoose.model("Subscription", subscriptionSchema);



export { Subscription };
