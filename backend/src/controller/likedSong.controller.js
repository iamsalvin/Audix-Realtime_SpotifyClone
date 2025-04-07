import { LikedSong } from "../models/likedSong.model.js";
import { Song } from "../models/song.model.js";

// Toggle like/unlike a song
export const toggleLikeSong = async (req, res, next) => {
  try {
    const { songId } = req.body;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    console.log(`Toggling like status for song: ${songId} by user: ${userId}`);

    // Check if song exists
    const songExists = await Song.findById(songId);
    if (!songExists) {
      console.log(`Song not found: ${songId}`);
      return res.status(404).json({ message: "Song not found" });
    }

    // Check if song is already liked by the user
    const existingLike = await LikedSong.findOne({ userId, songId });

    if (existingLike) {
      // Unlike: remove from liked songs
      console.log(`Unliking song: ${songId}`);
      await LikedSong.findByIdAndDelete(existingLike._id);
      return res.status(200).json({ 
        message: "Song unliked successfully",
        liked: false,
        songId
      });
    } else {
      // Like: add to liked songs
      console.log(`Liking song: ${songId}`);
      const newLikedSong = new LikedSong({
        userId,
        songId
      });
      await newLikedSong.save();
      return res.status(201).json({ 
        message: "Song liked successfully",
        liked: true,
        songId,
        likeId: newLikedSong._id
      });
    }
  } catch (error) {
    console.error("Error in toggleLikeSong:", error);
    res.status(500).json({ message: "Failed to toggle like status", error: error.message });
  }
};

// Get all liked songs for the current user
export const getLikedSongs = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    console.log(`Fetching liked songs for user: ${userId}`);
    
    // Find all liked songs by the user
    const likedSongs = await LikedSong.find({ userId })
      .sort({ createdAt: -1 }) // Latest liked songs first
      .populate({
        path: "songId",
        select: "title artist imageUrl audioUrl duration albumId mood",
        populate: {
          path: "albumId",
          select: "title"
        }
      });
      
    console.log(`Found ${likedSongs.length} liked songs for user: ${userId}`);
    
    // Filter out any null songId entries (in case songs were deleted)
    const validLikedSongs = likedSongs.filter(like => like.songId);
    
    if (validLikedSongs.length !== likedSongs.length) {
      console.log(`Filtered out ${likedSongs.length - validLikedSongs.length} invalid liked songs`);
    }
    
    // Transform the data to return just the song objects with like info
    const songs = validLikedSongs.map(like => {
      // Make sure songId exists and has expected properties
      if (!like.songId) return null;
      
      const songObject = like.songId.toObject ? like.songId.toObject() : like.songId;
      
      return {
        ...songObject,
        _id: songObject._id.toString(), // Ensure ID is a string
        likedAt: like.createdAt,
        likeId: like._id.toString() // Ensure ID is a string
      };
    }).filter(Boolean); // Remove any null entries

    console.log(`Returning ${songs.length} songs to client`);
    res.status(200).json(songs);
  } catch (error) {
    console.error("Error in getLikedSongs:", error);
    res.status(500).json({ message: "Failed to fetch liked songs", error: error.message });
  }
};

// Check if a song is liked by the current user
export const checkSongLiked = async (req, res, next) => {
  try {
    const { songId } = req.params;
    const userId = req.auth.userId;

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    const isLiked = await LikedSong.exists({ userId, songId });
    
    res.status(200).json({ liked: !!isLiked });
  } catch (error) {
    console.log("Error in checkSongLiked:", error);
    next(error);
  }
};

// Get like status for multiple songs at once
export const getBulkLikeStatus = async (req, res, next) => {
  try {
    const { songIds } = req.body;
    const userId = req.auth.userId;

    if (!songIds || !Array.isArray(songIds)) {
      return res.status(400).json({ message: "Song IDs array is required" });
    }

    // Find all liked songs by the user from the provided list
    const likedSongs = await LikedSong.find({
      userId,
      songId: { $in: songIds }
    });

    // Create a map of songId -> liked status
    const likeStatusMap = {};
    songIds.forEach(id => {
      likeStatusMap[id] = false;
    });

    // Update the ones that are liked
    likedSongs.forEach(like => {
      likeStatusMap[like.songId.toString()] = true;
    });

    res.status(200).json(likeStatusMap);
  } catch (error) {
    console.log("Error in getBulkLikeStatus:", error);
    next(error);
  }
};
