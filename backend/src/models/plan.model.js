import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  interval: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true
  },

  features: {
    maxForms: Number,
    maxResponses: Number,
    allowFileUpload: Boolean,
    allowGeofence: Boolean
  },

  isActive: {
    type: Boolean,
    default: true
  }
});

export const Plan = mongoose.model("Plan", planSchema);