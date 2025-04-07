import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    playDuration: {
      type: Number, // duration in seconds
      default: 0,
    },
    playCount: {
      type: Number,
      default: 1,
    },
    lastPlayed: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

// Compound index for efficient querying
userActivitySchema.index({ userId: 1, songId: 1 }, { unique: true });

export const UserActivity = mongoose.model("UserActivity", userActivitySchema);
