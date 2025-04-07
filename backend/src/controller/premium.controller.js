import { User } from "../models/user.model.js";

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
      premiumTier: user.premiumTier || 'none',
      premiumSince: user.premiumSince,
      premiumExpiresAt: user.premiumExpiresAt
    });
  } catch (error) {
    console.error("Error getting premium status:", error);
    res.status(500).json({ message: "Failed to get premium status", error: error.message });
  }
};

// Process payment and upgrade to premium
export const upgradeToPremium = async (req, res, next) => {
  try {
    const { paymentMethod, tier = 'premium' } = req.body;
    const userId = req.auth.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method is required" });
    }
    
    // Find user by clerkId
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // In a real app, you would process payment here
    // For demo purposes, we'll just update the user's premium status
    
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(now.getFullYear() + 1); // Premium lasts for 1 year
    
    // Update user with premium status
    user.isPremium = true;
    user.premiumTier = tier;
    user.premiumSince = now;
    user.premiumExpiresAt = expiresAt;
    
    await user.save();
    
    console.log(`User ${userId} upgraded to premium tier: ${tier}`);
    
    return res.status(200).json({
      success: true,
      message: "Successfully upgraded to premium",
      isPremium: true,
      premiumTier: tier,
      premiumSince: now,
      premiumExpiresAt: expiresAt
    });
  } catch (error) {
    console.error("Error upgrading to premium:", error);
    res.status(500).json({ message: "Failed to upgrade to premium", error: error.message });
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
    
    // Update user to remove premium status
    user.isPremium = false;
    user.premiumTier = 'none';
    user.premiumExpiresAt = new Date(); // Expire immediately
    
    await user.save();
    
    console.log(`User ${userId} cancelled premium subscription`);
    
    return res.status(200).json({
      success: true,
      message: "Successfully cancelled premium subscription"
    });
  } catch (error) {
    console.error("Error cancelling premium:", error);
    res.status(500).json({ message: "Failed to cancel premium", error: error.message });
  }
};

// Get all premium users
export const getPremiumUsers = async (req, res, next) => {
  try {
    // Find all users with isPremium set to true
    const premiumUsers = await User.find({ isPremium: true }).select('clerkId');
    
    // Extract clerkIds from premium users
    const premiumUserIds = premiumUsers.map(user => user.clerkId);

    return res.status(200).json({
      success: true,
      premiumUsers: premiumUserIds
    });
  } catch (error) {
    console.error("Error fetching premium users:", error);
    res.status(500).json({ message: "Failed to fetch premium users", error: error.message });
  }
};
