import { Router } from "express";
import { checkSongLiked, getBulkLikeStatus, getLikedSongs, toggleLikeSong } from "../controller/likedSong.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// All routes are protected - require user authentication
router.use(protectRoute);

// Get all liked songs for the current user
router.get("/", getLikedSongs);

// Check if a song is liked by the current user
router.get("/check/:songId", checkSongLiked);

// Get like status for multiple songs at once
router.post("/check-bulk", getBulkLikeStatus);

// Toggle like/unlike status
router.post("/toggle", toggleLikeSong);

export default router;
