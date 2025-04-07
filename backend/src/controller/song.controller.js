import { Song } from "../models/song.model.js";

export const getAllSongs = async (req, res, next) => {
	try {
		// -1 = Descending => newest -> oldest
		// 1 = Ascending => oldest -> newest
		const songs = await Song.find().sort({ createdAt: -1 });
		res.json(songs);
	} catch (error) {
		next(error);
	}
};

export const getFeaturedSongs = async (req, res, next) => {
	try {
		// fetch 6 random songs using mongodb's aggregation pipeline
		const songs = await Song.aggregate([
			{
				$sample: { size: 6 },
			},
			{
				$project: {
					_id: 1,
					title: 1,
					artist: 1,
					imageUrl: 1,
					audioUrl: 1,
				},
			},
		]);

		res.json(songs);
	} catch (error) {
		next(error);
	}
};

export const getMadeForYouSongs = async (req, res, next) => {
	try {
		const songs = await Song.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					title: 1,
					artist: 1,
					imageUrl: 1,
					audioUrl: 1,
				},
			},
		]);

		res.json(songs);
	} catch (error) {
		next(error);
	}
};

export const getTrendingSongs = async (req, res, next) => {
	try {
		const songs = await Song.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					title: 1,
					artist: 1,
					imageUrl: 1,
					audioUrl: 1,
				},
			},
		]);

		res.json(songs);
	} catch (error) {
		next(error);
	}
};

// Get songs by mood
export const getSongsByMood = async (req, res, next) => {
  try {
    const { mood } = req.params;
    
    // Validate mood
    const validMoods = ["happy", "sad", "energetic", "focus", "heartbreak", "relax", "love", "feel_good", "party", "chill"];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({ message: "Invalid mood" });
    }
    
    // Get songs by mood or all moods if no mood is specified
    let songs;
    if (mood) {
      songs = await Song.find({ mood }).sort({ createdAt: -1 }).limit(20);
    } else {
      // Group songs by mood and get up to 8 songs for each mood
      const songsByMood = {};
      
      // Get all moods with songs
      const moodsWithSongs = await Song.distinct('mood');
      
      // Get 8 songs for each mood with songs
      for (const mood of moodsWithSongs) {
        songsByMood[mood] = await Song.find({ mood })
          .sort({ createdAt: -1 })
          .limit(8);
      }
      
      return res.status(200).json(songsByMood);
    }
    
    res.status(200).json(songs);
  } catch (error) {
    console.log("Error in getSongsByMood:", error);
    next(error);
  }
};

// Get all available moods
export const getMoods = async (req, res, next) => {
  try {
    // Map of all available moods with their user-friendly labels
    const moodLabels = {
      "happy": "Happy",
      "sad": "Sad",
      "energetic": "Energetic",
      "focus": "Focus",
      "heartbreak": "Heartbreak",
      "relax": "Relax", 
      "love": "Love",
      "feel_good": "Feel Good",
      "party": "Party",
      "chill": "Chill"
    };
    
    // Always return all predefined moods, even if no songs use them yet
    const moodsWithLabels = Object.entries(moodLabels).map(([value, label]) => ({
      value,
      label
    }));
    
    res.status(200).json(moodsWithLabels);
  } catch (error) {
    console.log("Error in getMoods:", error);
    next(error);
  }
};
