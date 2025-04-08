import dotenv from "dotenv";

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  adminEmail: process.env.ADMIN_EMAIL,
  cloudinary: {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  },
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://audix-app.vercel.app", "https://audix-app.netlify.app"]
        : "http://localhost:5173",
    credentials: true,
  },
};

export default config;
