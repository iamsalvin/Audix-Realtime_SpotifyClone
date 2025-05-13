const fs = require("fs");
const path = require("path");
const { copySync, ensureDirSync, existsSync } = require("fs-extra");

console.log("Running post-build script...");

// Define paths
const sourceDir = path.resolve(__dirname, "../frontend/dist");
const targetParentDir = path.resolve(__dirname, "../backend/frontend");
const targetDir = path.resolve(targetParentDir, "dist");

// Create target directory if it doesn't exist
try {
  console.log(`Ensuring directory exists: ${targetParentDir}`);
  ensureDirSync(targetParentDir);

  // Check if source exists
  if (existsSync(sourceDir)) {
    console.log(`Copying from ${sourceDir} to ${targetDir}`);
    copySync(sourceDir, targetDir, { overwrite: true });
    console.log("Frontend build files copied successfully");
  } else {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
} catch (err) {
  console.error("Error in post-build script:", err);
  process.exit(1);
}
