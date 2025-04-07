import express from "express";
import {
  logActivity,
  getRecentlyPlayed,
  getMostPlayed,
  getMostListenedArtists,
  getListeningSummary,
  getUserActivityData
} from "../controller/userActivity.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Log song play activity
router.post("/log", logActivity);

// Get recently played songs
router.get("/recent", getRecentlyPlayed);

// Get most played songs
router.get("/most-played", getMostPlayed);

// Get most listened artists
router.get("/top-artists", getMostListenedArtists);

// Get listening summary (stats)
router.get("/summary", getListeningSummary);

// Get all activity data for the activity page (combined endpoint)
router.get("/all", getUserActivityData);

export default router;
