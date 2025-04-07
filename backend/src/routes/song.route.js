import { Router } from "express";
import { 
  getAllSongs, 
  getFeaturedSongs, 
  getMadeForYouSongs, 
  getTrendingSongs,
  getSongsByMood,
  getMoods
} from "../controller/song.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protectRoute, requireAdmin, getAllSongs);
router.get("/featured", getFeaturedSongs);
router.get("/made-for-you", getMadeForYouSongs);
router.get("/trending", getTrendingSongs);
router.get("/moods", getMoods);
router.get("/moods/:mood", getSongsByMood);
router.get("/by-mood", getSongsByMood);

export default router;