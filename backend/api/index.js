import dotenv from "dotenv";
import express from "express";
import connectDB from "../src/db/index.js";
import { app } from "../src/app.js";

dotenv.config();

// Wrap the Express app so DB connects before any route is hit
let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
