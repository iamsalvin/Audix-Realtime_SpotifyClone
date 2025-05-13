import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      default: "",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumSince: {
      type: Date,
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    premiumTier: {
      type: String,
      enum: ["none", "basic", "standard", "premium"],
      default: "none",
    },
    subscriptionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true } //  createdAt, updatedAt
);

export const User = mongoose.model("User", userSchema);
