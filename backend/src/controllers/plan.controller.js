import { Plan } from "../models/plan.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";



const createPlan =asyncHandler( async (req, res) => {
  const { name, price, currency, interval, features } = req.body;


    console.log("name of the plane " ,name);

    console.log("price of the plane " ,price)
    console.log("currency of the plane " ,currency)
    console.log("interval of the plane " ,interval)
    console.log("features of the plane " ,features)

    const userId= req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({ success: false, message: "Plan with this name already exists" });
    }

  const plan = await Plan.create({ name, price, currency, interval, features });
  res.status(201).json({ success: true, data: plan });

});
const getPlans=asyncHandler( async (req, res) => {

  const plans = await Plan.find({ isActive: true });
  res.status(200).json({ success: true, data: plans });

});

export { createPlan, getPlans };