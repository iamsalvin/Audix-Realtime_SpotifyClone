import { UserActivity } from "../models/userActivity.model.js";
import { Song } from "../models/song.model.js";
import mongoose from "mongoose";

// Log activity when a song is played
export const logActivity = async (req, res, next) => {
  try {
    const { songId, playDuration } = req.body;
    const userId = req.auth.userId;

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    if (!playDuration || playDuration <= 0) {
      return res
        .status(400)
        .json({ message: "Valid play duration is required" });
    }

    // Find if the user has already played this song
    let existingActivity = await UserActivity.findOne({ userId, songId });

    if (existingActivity) {
      // Update existing record
      existingActivity.playCount += 1;
      existingActivity.playDuration += playDuration;
      existingActivity.lastPlayed = new Date();
    } else {
      // For new records, we need to get the song details to save the artist
      const song = await Song.findById(songId);

      if (!song) {
        return res.status(404).json({ message: "Song not found" });
      }

      // Create new record with artist data
      existingActivity = new UserActivity({
        userId,
        songId,
        artist: song.artist, // Include artist from the song
        playCount: 1,
        playDuration,
        lastPlayed: new Date(),
      });
    }

    await existingActivity.save();

    res.status(200).json({
      message: "Activity updated",
      activity: existingActivity,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    next(error);
  }
};

// Get recently played songs
export const getRecentlyPlayed = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    let recentlyPlayed = [];
    try {
      recentlyPlayed = await UserActivity.find({ userId })
        .sort({ lastPlayed: -1 })
        .limit(10)
        .populate({
          path: "songId",
          select: "_id title artist imageUrl audioUrl duration",
        });
    } catch (error) {
      console.error("Error fetching recently played songs:", error);
    }

    return res.status(200).json(recentlyPlayed);
  } catch (error) {
    console.error("Error fetching recently played:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch recently played songs",
        error: error.message,
      });
  }
};

// Get most played songs
export const getMostPlayed = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    let mostPlayed = [];
    try {
      mostPlayed = await UserActivity.find({ userId })
        .sort({ playCount: -1 })
        .limit(10)
        .populate({
          path: "songId",
          select: "_id title artist imageUrl audioUrl duration",
        });
    } catch (error) {
      console.error("Error fetching most played songs:", error);
    }

    return res.status(200).json(mostPlayed);
  } catch (error) {
    console.error("Error fetching most played songs:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch most played songs",
        error: error.message,
      });
  }
};

// Get user's most listened artists
export const getMostListenedArtists = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    let topArtists = [];
    try {
      topArtists = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: "$song" },
        {
          $group: {
            _id: "$song.artist",
            totalPlayCount: { $sum: "$playCount" },
            totalPlayDuration: { $sum: "$playDuration" },
          },
        },
        { $sort: { totalPlayCount: -1 } },
        { $limit: 9 },
        {
          $project: {
            _id: 0,
            artist: "$_id",
            totalPlayCount: 1,
            totalPlayDuration: 1,
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching top artists:", error);
    }

    return res.status(200).json(topArtists);
  } catch (error) {
    console.error("Error fetching most listened artists:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch most listened artists",
        error: error.message,
      });
  }
};

// Get user's listening summary (total play time, song count, etc.)
export const getListeningSummary = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    let uniqueSongsCount = 0;
    let uniqueArtistsCount = 0;
    let totalPlayCount = 0;
    let totalPlayDuration = 0;

    try {
      uniqueSongsCount = await UserActivity.distinct("songId", { userId })
        .length;
    } catch (error) {
      console.error("Error fetching unique songs count:", error);
    }

    try {
      const artistsResult = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: "$song" },
        { $group: { _id: "$song.artist" } },
        { $count: "count" },
      ]);

      uniqueArtistsCount =
        artistsResult.length > 0 ? artistsResult[0].count : 0;
    } catch (error) {
      console.error("Error fetching unique artists count:", error);
    }

    try {
      const totalStatsResult = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalPlayCount: { $sum: "$playCount" },
            totalPlayDuration: { $sum: "$playDuration" },
          },
        },
      ]);

      if (totalStatsResult.length > 0) {
        totalPlayCount = totalStatsResult[0].totalPlayCount;
        totalPlayDuration = totalStatsResult[0].totalPlayDuration;
      }
    } catch (error) {
      console.error("Error fetching total stats:", error);
    }

    const listeningSummary = {
      uniqueSongsCount,
      uniqueArtistsCount,
      totalPlayCount,
      totalPlayDuration,
    };

    return res.status(200).json(listeningSummary);
  } catch (error) {
    console.error("Error fetching listening summary:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch listening summary",
        error: error.message,
      });
  }
};

// Get all user's activity data for the activity page
export const getUserActivityData = async (req, res, next) => {
  try {
    const userId = req.auth.userId;

    console.log(`Fetching activity data for user: ${userId}`);

    let recentlyPlayed = [];
    let mostPlayed = [];
    let topArtists = [];
    let uniqueSongsCount = 0;
    let uniqueArtistsCount = 0;
    let totalPlayCount = 0;
    let totalPlayDuration = 0;

    try {
      recentlyPlayed = await UserActivity.find({ userId })
        .sort({ lastPlayed: -1 })
        .limit(20)
        .populate({
          path: "songId",
          select: "_id title artist imageUrl audioUrl duration",
        });
    } catch (error) {
      console.error("Error fetching recently played songs:", error);
    }

    try {
      mostPlayed = await UserActivity.find({ userId })
        .sort({ playCount: -1 })
        .limit(10)
        .populate({
          path: "songId",
          select: "_id title artist imageUrl audioUrl duration",
        });
    } catch (error) {
      console.error("Error fetching most played songs:", error);
    }

    try {
      topArtists = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: "$song" },
        {
          $group: {
            _id: "$song.artist",
            totalPlayCount: { $sum: "$playCount" },
            totalPlayDuration: { $sum: "$playDuration" },
          },
        },
        { $sort: { totalPlayCount: -1 } },
        { $limit: 9 },
        {
          $project: {
            _id: 0,
            artist: "$_id",
            totalPlayCount: 1,
            totalPlayDuration: 1,
          },
        },
      ]);
    } catch (error) {
      console.error("Error fetching top artists:", error);
    }

    try {
      uniqueSongsCount = await UserActivity.distinct("songId", { userId })
        .length;
    } catch (error) {
      console.error("Error fetching unique songs count:", error);
    }

    try {
      const artistsResult = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $lookup: {
            from: "songs",
            localField: "songId",
            foreignField: "_id",
            as: "song",
          },
        },
        { $unwind: "$song" },
        { $group: { _id: "$song.artist" } },
        { $count: "count" },
      ]);

      uniqueArtistsCount =
        artistsResult.length > 0 ? artistsResult[0].count : 0;
    } catch (error) {
      console.error("Error fetching unique artists count:", error);
    }

    try {
      const totalStatsResult = await UserActivity.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalPlayCount: { $sum: "$playCount" },
            totalPlayDuration: { $sum: "$playDuration" },
          },
        },
      ]);

      if (totalStatsResult.length > 0) {
        totalPlayCount = totalStatsResult[0].totalPlayCount;
        totalPlayDuration = totalStatsResult[0].totalPlayDuration;
      }
    } catch (error) {
      console.error("Error fetching total stats:", error);
    }

    const listeningSummary = {
      uniqueSongsCount,
      uniqueArtistsCount,
      totalPlayCount,
      totalPlayDuration,
    };

    console.log(
      `Recently played: ${recentlyPlayed.length}, Most played: ${mostPlayed.length}, Top artists: ${topArtists.length}`
    );

    res.status(200).json({
      recentlyPlayed,
      mostPlayed,
      topArtists,
      listeningSummary,
    });
  } catch (error) {
    console.error("Error in getUserActivityData:", error);
    next(error);
  }
};
