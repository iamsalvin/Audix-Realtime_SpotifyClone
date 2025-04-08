const config = {
  apiUrl: import.meta.env.PROD
    ? "https://audix-api.onrender.com"
    : "http://localhost:5000",
  wsUrl: import.meta.env.PROD
    ? "wss://audix-api.onrender.com"
    : "ws://localhost:5000",
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
};

export default config;
