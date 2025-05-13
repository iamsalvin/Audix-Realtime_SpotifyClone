import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// Initialize Razorpay with your API key and secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
