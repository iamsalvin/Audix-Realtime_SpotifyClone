import { User } from "../models/user.model.js";
import { cancelSubscription } from "./payment.controller.js";

// Get premium status for the current user
export const getPremiumStatus = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user by clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return premium status
    return res.status(200).json({
      isPremium: user.isPremium || false,
      premiumTier: user.premiumTier || "none",
      premiumSince: user.premiumSince,
      premiumExpiresAt: user.premiumExpiresAt,
      subscriptionId: user.subscriptionId || null,
    });
  } catch (error) {
    console.error("Error getting premium status:", error);
    res
      .status(500)
      .json({ message: "Failed to get premium status", error: error.message });
  }
};

// Redirect to payment process
export const upgradeToPremium = async (req, res, next) => {
  try {
    const { tier = "premium" } = req.body;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user by clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Instead of directly upgrading, we redirect to payment process
    // This returns information to initiate the payment flow
    return res.status(200).json({
      success: true,
      message: "Please proceed to payment",
      tier: tier,
      redirectToPayment: true,
    });
  } catch (error) {
    console.error("Error processing premium upgrade request:", error);
    res.status(500).json({
      message: "Failed to process premium upgrade request",
      error: error.message,
    });
  }
};

// Cancel premium subscription
export const cancelPremium = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Find user by clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user has a subscription ID, cancel through the payment controller
    if (user.subscriptionId) {
      try {
        // Direct call to the cancelSubscription function instead of using axios
        // This will skip the HTTP round trip
        await cancelSubscription(req, res);
        return; // The response has already been sent by cancelSubscription
      } catch (cancelError) {
        console.error("Error cancelling subscription:", cancelError);
      }
    }

    // Fallback to manual cancellation if subscription cancellation fails or there's no subscription ID
    user.isPremium = false;
    user.premiumTier = "none";
    user.premiumExpiresAt = new Date(); // Expire immediately
    user.subscriptionId = null;

    await user.save();

    console.log(`User ${userId} cancelled premium subscription`);

    return res.status(200).json({
      success: true,
      message: "Successfully cancelled premium subscription",
    });
  } catch (error) {
    console.error("Error cancelling premium:", error);
    res
      .status(500)
      .json({ message: "Failed to cancel premium", error: error.message });
  }
};

// Get all premium users
export const getPremiumUsers = async (req, res, next) => {
  try {
    // Find all users with isPremium set to true with full details
    const premiumUsers = await User.find({ isPremium: true }).select(
      "_id clerkId fullName email imageUrl isPremium premiumTier premiumSince premiumExpiresAt subscriptionId createdAt"
    );

    return res.status(200).json({
      success: true,
      premiumUsers: premiumUsers
    });
  } catch (error) {
    console.error("Error fetching premium users:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch premium users", error: error.message });
  }
};

// Get all users with subscription details for admin dashboard
export const getAllUsersWithSubscriptions = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    // Check if the user is an admin
    const adminUser = await User.findOne({ clerkId: userId });
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    // Find all users and include their subscription details
    const users = await User.find({}).select(
      "clerkId fullName email imageUrl isPremium premiumTier premiumSince premiumExpiresAt subscriptionId createdAt"
    );

    return res.status(200).json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error("Error fetching users with subscriptions:", error);
    res.status(500).json({ 
      message: "Failed to fetch users with subscription details", 
      error: error.message 
    });
  }
};
