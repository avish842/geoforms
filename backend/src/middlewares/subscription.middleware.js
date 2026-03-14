import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getEntitlementForUser } from "../services/subscription.service.js";

const attachEntitlement = asyncHandler(async (req, _res, next) => {
  const userId = req.user?._id;
  req.entitlement = await getEntitlementForUser(userId);
  next();
});

const requireActiveSubscription = asyncHandler(async (req, _res, next) => {
  const userId = req.user?._id;
  const entitlement = await getEntitlementForUser(userId);

  if (!entitlement.isActive) {
    throw new ApiError(403, "Active subscription required");
  }

  req.entitlement = entitlement;
  next();
});

const requireFeature = (featureName) =>
  asyncHandler(async (req, _res, next) => {
    const userId = req.user?._id;
    const entitlement = req.entitlement || (await getEntitlementForUser(userId));

    if (!entitlement.isActive) {
      throw new ApiError(403, "Active subscription required");
    }

    if (!entitlement.features?.[featureName]) {
      throw new ApiError(403, `Current plan does not allow ${featureName}`);
    }

    req.entitlement = entitlement;
    next();
  });

export { attachEntitlement, requireActiveSubscription, requireFeature };
