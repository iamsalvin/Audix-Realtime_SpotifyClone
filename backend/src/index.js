import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";

import { initializeSocket } from "./lib/socket.js";

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";
import likedSongRoutes from "./routes/likedSong.route.js";
import userActivityRoutes from "./routes/userActivity.route.js";
import premiumRoutes from "./routes/premium.route.js";
import paymentRoutes from "./routes/payment.route.js";

dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://audix-realtime.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json()); // to parse req.body
app.use(clerkMiddleware()); // this will add auth to req obj => req.auth
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
    createParentPath: true,
    debug: true, // Enable debug mode for better error logging
    abortOnLimit: true, // Return 413 when limit is reached
    responseOnLimit: "File size limit has been reached (50MB maximum)",
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size for audio files
    },
    uploadTimeout: 120000, // 2 minute timeout for uploads
  })
);

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
  if (fs.existsSync(tempDir)) {
    fs.readdir(tempDir, (err, files) => {
      if (err) {
        console.log("error", err);
        return;
      }
      for (const file of files) {
        fs.unlink(path.join(tempDir, file), (err) => {});
      }
    });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/liked-songs", likedSongRoutes);
app.use("/api/activity", userActivityRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/payments", paymentRoutes);

if (process.env.NODE_ENV === "production") {
  // Try multiple possible paths to find the frontend build
  const possiblePaths = [
    path.join(__dirname, "../../frontend/dist"),
    path.join(__dirname, "../frontend/dist"),
    path.join(__dirname, "frontend/dist"),
    path.join(process.cwd(), "frontend/dist"),
    path.join(process.cwd(), "../frontend/dist"),
    path.join(__dirname, "../frontend/frontend/dist"), // Path after our post-build script
    path.join(__dirname, "frontend/frontend/dist"), // Alternate path
    path.join(process.cwd(), "backend/frontend/dist"), // Path from post-build script
  ];

  let frontendPath = null;

  // Find the first path that exists
  for (const pathToTry of possiblePaths) {
    try {
      if (fs.existsSync(pathToTry)) {
        frontendPath = pathToTry;
        console.log("Found frontend build at:", frontendPath);
        break;
      }
    } catch (err) {
      console.log("Path check error:", pathToTry, err.message);
    }
  }

  if (frontendPath) {
    app.use(express.static(frontendPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } else {
    console.error("Could not find frontend build directory!");
    // List all directories for debugging
    possiblePaths.forEach((dir) => {
      const parentDir = path.dirname(dir);
      try {
        if (fs.existsSync(parentDir)) {
          console.log(`Contents of ${parentDir}:`, fs.readdirSync(parentDir));
        }
      } catch (e) {
        console.log(`Could not read ${parentDir}:`, e.message);
      }
    });
  }
}

// error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

httpServer.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
  connectDB();
});
