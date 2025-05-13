import razorpay from "../config/razorpay.config.js";
import crypto from "crypto";
import { User } from "../models/user.model.js";

// Define subscription plan IDs for different tiers
const SUBSCRIPTION_PLANS = {
  basic: "plan_QMVcVBiDBwO75Y", // Basic plan (₹99)
  standard: "plan_QMVbu1OyLC9s4J", // Standard plan (₹149)
  premium: "plan_QMVaPLecYzUJjg", // Premium plan (₹199)
};

// Define pricing for different subscription tiers (as fallback)
const SUBSCRIPTION_PRICES = {
  basic: 99 * 100, // ₹99 in paise
  standard: 149 * 100, // ₹149 in paise
  premium: 199 * 100, // ₹199 in paise
};

// Define actual prices displayed to the user
const DISPLAYED_PRICES = {
  basic: "₹99",
  standard: "₹149",
  premium: "₹199",
};

// Cache user lookups to improve performance
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper function to get user with caching
async function getUserByClerkId(clerkId) {
  // Check cache first
  const cacheKey = `user_${clerkId}`;
  if (userCache.has(cacheKey)) {
    const cachedData = userCache.get(cacheKey);
    if (Date.now() < cachedData.expiry) {
      return cachedData.user;
    }
    // Cache expired, remove it
    userCache.delete(cacheKey);
  }

  // Fetch from database
  const user = await User.findOne({ clerkId });

  // Store in cache if found
  if (user) {
    userCache.set(cacheKey, {
      user,
      expiry: Date.now() + CACHE_TTL,
    });
  }

  return user;
}

// Create a Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { tier = "premium" } = req.body;
    const userId = req.auth.userId;

    // Quick validation to fail fast
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate tier value immediately
    if (!["basic", "standard", "premium"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier selected" });
    }

    // Get user (cached if possible)
    const user = await getUserByClerkId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare amount based on tier
    const amount = SUBSCRIPTION_PRICES[tier];

    try {
      // Create order options
      const options = {
        amount,
        currency: "INR",
        receipt: `receipt_${tier}_${Date.now()}`,
        notes: {
          userId: user._id.toString(),
          tier,
          clerkId: userId,
        },
      };

      // Create the order (most time-consuming operation)
      const order = await razorpay.orders.create(options);

      // Send response with everything the frontend needs
      return res.status(200).json({
        success: true,
        order,
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        name: user.fullName,
        email: user.email,
        contact: "",
        tier,
        displayedPrice: DISPLAYED_PRICES[tier],
      });
    } catch (error) {
      console.error("Error creating order:", error);
      return res.status(500).json({
        message: "Failed to create payment",
        error: error.message,
        tier,
      });
    }
  } catch (error) {
    console.error("Error in payment process:", error);
    return res.status(500).json({
      message: "Failed to process payment",
      error: error.message,
    });
  }
};

// Verify Razorpay payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      tier = "premium",
    } = req.body;

    const userId = req.auth.userId;

    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res
        .status(400)
        .json({ message: "Missing required payment information" });
    }

    // Generate signature for verification (fast operation)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Verify signature immediately
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Now that payment is verified, update user in database
    const user = await getUserByClerkId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with premium status
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(now.getFullYear() + 1); // Premium lasts for 1 year

    user.isPremium = true;
    user.premiumTier = tier;
    user.premiumSince = now;
    user.premiumExpiresAt = expiresAt;

    // Save user with updated premium status
    await user.save();

    // Clear cache for this user
    userCache.delete(`user_${userId}`);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Payment successful and premium status updated",
      isPremium: true,
      premiumTier: tier,
      premiumSince: now,
      premiumExpiresAt: expiresAt,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// Cancel a subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Get user with caching
    const user = await getUserByClerkId(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user to remove premium status
    user.isPremium = false;
    user.premiumTier = "none";
    user.premiumExpiresAt = new Date(); // Expire immediately
    user.subscriptionId = null;

    await user.save();

    // Clear cache for this user
    userCache.delete(`user_${userId}`);

    return res.status(200).json({
      success: true,
      message: "Successfully cancelled subscription",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
};
