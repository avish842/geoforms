import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlan,getPlans } from "../controllers/plan.controller.js";



const router = Router();


router.route("/create-plan").post(verifyJWT,createPlan); // Create plan route
router.route("/plans").get(getPlans); // Get plans route

export {router};