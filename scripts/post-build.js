const fs = require("fs");
const path = require("path");

console.log("Running post-build script...");

// Helper functions to replace fs-extra
function copyFolderSync(source, target) {
  // Create target folder if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Read all files/folders from source folder
  const items = fs.readdirSync(source);

  // Loop through each item
  items.forEach((item) => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    // Check if it's a file or a folder
    const stat = fs.statSync(sourcePath);

    if (stat.isFile()) {
      // If it's a file, copy it
      fs.copyFileSync(sourcePath, targetPath);
    } else if (stat.isDirectory()) {
      // If it's a folder, recursively copy its contents
      copyFolderSync(sourcePath, targetPath);
    }
  });
}

// Define paths
const sourceDir = path.resolve(__dirname, "../frontend/dist");
const targetParentDir = path.resolve(__dirname, "../backend/frontend");
const targetDir = path.resolve(targetParentDir, "dist");

// Create target directory if it doesn't exist
try {
  console.log(`Ensuring directory exists: ${targetParentDir}`);
  if (!fs.existsSync(targetParentDir)) {
    fs.mkdirSync(targetParentDir, { recursive: true });
  }

  // Check if source exists
  if (fs.existsSync(sourceDir)) {
    console.log(`Copying from ${sourceDir} to ${targetDir}`);
    copyFolderSync(sourceDir, targetDir);
    console.log("Frontend build files copied successfully");
  } else {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }
} catch (err) {
  console.error("Error in post-build script:", err);
  process.exit(1);
}
