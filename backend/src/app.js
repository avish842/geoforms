import express from 'express';
import cors from 'cors';// Importing CORS middleware to handle Cross-Origin Resource Sharing
import cookieParser from 'cookie-parser';

const app = express();
const isCorsDebug = process.env.CORS_DEBUG === "true";

const normalizeOrigin = (value) => {
  if (!value) return "";

  const trimmed = value.trim().replace(/\/$/, "");

  // If only a hostname is provided in env (e.g. geoforms.in), compare by host.
  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^www\./i, "").toLowerCase();
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.host.replace(/^www\./i, "").toLowerCase();
  } catch {
    return trimmed.replace(/^www\./i, "").toLowerCase();
  }
};

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(s => normalizeOrigin(s)).filter(Boolean) || [];
    const requestOrigin = normalizeOrigin(origin);
    if (isCorsDebug) {
      console.log("[CORS]", {
        origin,
        requestOrigin,
        allowedOrigins,
        matched: allowedOrigins.includes(requestOrigin)
      });
    }
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(requestOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({limit:"17kb"}))// Limit the size of JSON payloads to 17kb
app.use(express.urlencoded({extended:true,limit:"17kb"}))// Parse URL-encoded bodies with a limit of 17kb
app.use(express.static("public"))// Serve static files from the "public" directory or bahar se ane files ko public folder se serve karega 
app.use(cookieParser())// Parse cookies from incoming requests and make them available in req.cookies 


//routes import  
import { router } from './routes/user.routes.js';
import { router as planRouter } from './routes/plan.routes.js';
import { paymentRouter } from './routes/payment.route.js';


//routes declaration
app.use('/api/v1/user', router);
app.use('/api/v1/plan', planRouter);
app.use('/api/v1/payment',paymentRouter);
// All user-related routes will be prefixed with /user agar user se shuru hota hai to usko userRoutes se handle karega. 

// http://localhost:5000/api/v1/user/(register or login or any other user related route) will be handled by userRoutes then it will go to user.controller.js file

// Global error-handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export {app} 
export default app;