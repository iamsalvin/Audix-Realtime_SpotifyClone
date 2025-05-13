import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  cancelSubscription,
} from "../controller/payment.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// All routes are protected - require user authentication
router.use(protectRoute);

// Create a new Razorpay order
router.post("/create-order", createOrder);

// Verify Razorpay payment
router.post("/verify-payment", verifyPayment);

// Cancel a Razorpay subscription
router.post("/cancel-subscription", cancelSubscription);

export default router;
