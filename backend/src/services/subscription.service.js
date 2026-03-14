import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Plan } from "../models/plan.model.js";

const PLAN_ALIASES = {
  free: "free",
  basic: "basic",
  pro: "pro",
};

const PLAN_TIERS = {
  free: 0,
  basic: 1,
  pro: 2,
};

const normalizeUserPlan = (planName) => {
  if (!planName || typeof planName !== "string") return "basic";
  const normalized = planName.trim().toLowerCase();

  if (PLAN_ALIASES[normalized]) {
    return PLAN_ALIASES[normalized];
  }

  // Handle names like "Pro Monthly" or "Basic Plan"
  if (normalized.includes("pro")) return "pro";
  if (normalized.includes("basic")) return "basic";

  return "basic";
};

const getPlanTier = (planName) => {
  const normalizedPlan = normalizeUserPlan(planName);
  return PLAN_TIERS[normalizedPlan] ?? PLAN_TIERS.basic;
};


// Get the expiry date based on the plan interval (e.g., monthly, yearly)
const getExpiryFromInterval = (interval, fromDate = new Date()) => {
  const base = new Date(fromDate);
  if (interval === "yearly") {
    base.setFullYear(base.getFullYear() + 1);
    return base;
  }

  base.setMonth(base.getMonth() + 1);
  return base;
};

const getActiveSubscriptionWithPlan = async (userId) => {
  if (!userId) return null;

  return Subscription.findOne({
    userId,
    status: "success",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .populate("planId");
};

const getEntitlementForUser = async (userId) => {
  const subscription = await getActiveSubscriptionWithPlan(userId);
  const plan = subscription?.planId || null;

  if (subscription && plan) {
    return {
      subscription,
      plan,
      isActive: true,
      features: plan?.features || {},
    };
  }

  // Fallback for default/basic users who don't have a paid subscription row yet.
  const user = await User.findById(userId).select("plan").lean(); // 
  const normalizedPlanName = normalizeUserPlan(user?.plan);

  const fallbackPlan = await Plan.findOne({
    name: { $regex: `^${normalizedPlanName}$`, $options: "i" },
    isActive: true,
  }).lean();

  return {
    subscription,
    plan: fallbackPlan || null,
    isActive: Boolean(fallbackPlan),
    features: fallbackPlan?.features || {},
  };
};

export {
  getActiveSubscriptionWithPlan,
  getEntitlementForUser,
  getExpiryFromInterval,
  getPlanTier,
  normalizeUserPlan,
};
