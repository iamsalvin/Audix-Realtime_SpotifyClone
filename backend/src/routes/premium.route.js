import { Router } from "express";
import {
  getPremiumStatus,
  upgradeToPremium,
  cancelPremium,
  getPremiumUsers,
  getAllUsersWithSubscriptions,
} from "../controller/premium.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { User } from "../models/user.model.js";

const router = Router();

// All routes are protected - require user authentication
router.use(protectRoute);

// Get current user's premium status
router.get("/status", getPremiumStatus);

// Initiate premium subscription upgrade
router.post("/upgrade", upgradeToPremium);

// Cancel premium subscription
router.post("/cancel", cancelPremium);

// Get all premium users
router.get("/users", getPremiumUsers);

// Get all users with subscription details
router.get("/all-users", getAllUsersWithSubscriptions);

// Utility endpoint for testing - reset subscription status
// This is for development and testing purposes
router.post("/reset-status", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { status = false } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if this is a development/testing environment
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      return res.status(403).json({
        message:
          "This endpoint is only available in development or testing environments",
        currentEnv: process.env.NODE_ENV || "production",
      });
    }

    // Find user by clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `Manually resetting premium status for user ${userId} to ${
        status ? "PREMIUM" : "NOT PREMIUM"
      }`
    );

    // Reset premium status
    user.isPremium = Boolean(status);

    if (status) {
      // If setting to premium, set default values
      user.premiumTier = "premium";
      user.premiumSince = new Date();

      // Set expiry date to 1 year from now
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      user.premiumExpiresAt = expiryDate;
    } else {
      // If removing premium, clear premium data
      user.premiumTier = "none";
      user.premiumExpiresAt = new Date(); // Expire immediately
      user.subscriptionId = null;
    }

    await user.save();

    // Clear any caches
    if (global.userCache) {
      global.userCache.clear();
    }

    return res.status(200).json({
      success: true,
      message: `Premium status has been reset to ${
        status ? "premium" : "non-premium"
      }`,
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      premiumSince: user.premiumSince,
      premiumExpiresAt: user.premiumExpiresAt,
    });
  } catch (error) {
    console.error("Error resetting premium status:", error);
    return res.status(500).json({
      message: "Failed to reset premium status",
      error: error.message,
    });
  }
});

export default router;
