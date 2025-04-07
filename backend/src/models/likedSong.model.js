import mongoose from "mongoose";

const likedSongSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // Using clerk user ID
      required: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can like a song only once
likedSongSchema.index({ userId: 1, songId: 1 }, { unique: true });

export const LikedSong = mongoose.model("LikedSong", likedSongSchema);
