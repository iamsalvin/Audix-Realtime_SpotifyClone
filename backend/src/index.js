import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import config from "./config/index.js";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";
import likedSongRoutes from "./routes/likedSong.route.js";
import userActivityRoutes from "./routes/userActivity.route.js";
import premiumRoutes from "./routes/premium.route.js";
import { setupSocketHandlers } from "./socket/handlers.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(clerkMiddleware());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
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

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/liked-songs", likedSongRoutes);
app.use("/api/activity", userActivityRoutes);
app.use("/api/premium", premiumRoutes);

// Serve static files from frontend build
if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendBuildPath));

  // Handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

// Socket.io setup
const io = new Server(httpServer, {
  cors: config.cors,
});

setupSocketHandlers(io);

// Connect to MongoDB
connectDB();

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
