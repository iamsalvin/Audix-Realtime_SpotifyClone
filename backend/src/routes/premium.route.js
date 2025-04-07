import { Router } from "express";
import { getPremiumStatus, upgradeToPremium, cancelPremium, getPremiumUsers } from "../controller/premium.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// All routes are protected - require user authentication
router.use(protectRoute);

// Get premium status
router.get("/status", getPremiumStatus);

// Upgrade to premium
router.post("/upgrade", upgradeToPremium);

// Cancel premium subscription
router.post("/cancel", cancelPremium);

// Get all premium users
router.get("/users", getPremiumUsers);

export default router;
