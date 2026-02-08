import mongoose from "mongoose";
const { Schema } = mongoose;
import bcrypt from "bcrypt";
import {nanoid} from 'nanoid';
import jwt from "jsonwebtoken";



const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    isEmailVerified: { 
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: Date,
    },
    avatar: {
      type: String,
    },  
    coverImage: {
      type: String,
    },
    googleId: {
      type: String,
      index: true, // optional if using Firebase only
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },
     refreshToken: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "creator", "admin", "promoter"],
      default: "user",
    },

    referralCode: {
      type: String,
      unique: true,
      index: true,
    },

    referredBy: {
      type: String, // referralCode of referrer
      default: null,
    },

    totalReferrals: {
      type: Number,
      default: 0,
    },

    paidReferrals: {
      type: Number,
      default: 0,
    },

    isPaidUser: {
      type: Boolean,
      default: false,
    },

    plan: {
      type: String,
      enum: ["free", "basic", "pro"],
      default: "free",
    },

    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        plan: String,
        gateway: String,
        status: String,
        createdAt: {
          type: Date,
        },
      },
    ],
   
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.referralCode) return next();
  
  this.referralCode = nanoid(8).toUpperCase();
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.encryptPassword = async function (password) {
  return await bcrypt.hash(password, 10);
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // If password is not modified, skip hashing
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.generateAccessToken = function () {

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      usename: this.username,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1d",
    }
  )}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  )
}

const User = mongoose.model("User", userSchema);
export { User };
