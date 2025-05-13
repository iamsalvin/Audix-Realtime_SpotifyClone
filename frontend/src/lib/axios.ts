import axios, { AxiosRequestConfig } from "axios";

// Get the API base URL from environment variables or use localhost default
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "/api");

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Queue to store failed requests when offline
const failedRequestsQueue = new Set<AxiosRequestConfig>();
let isRetryingFailedRequests = false;

// Check if the browser is online
const isOnline = () => navigator.onLine;

// Add request interceptor for debugging and offline handling
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method?.toUpperCase(), config.url);

    // If we're offline, reject the request and queue it for later retry
    if (!isOnline()) {
      console.log("Offline: Queuing request for later", config.url);
      const queuedRequest = { ...config };
      failedRequestsQueue.add(queuedRequest);

      return Promise.reject(
        new Error("Currently offline. Request queued for later.")
      );
    }

    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "API Response Error:",
      error.response?.status,
      error.config?.url,
      error.message
    );

    // If the error is because of a Clerk token refresh failure or internet connection issue
    if (
      error.message.includes("Token refresh failed") ||
      error.message.includes("Network Error") ||
      !isOnline()
    ) {
      console.log(
        "Network/Token error detected. Queuing for retry when possible."
      );

      // If it's a request config that can be retried, queue it
      if (error.config && !error.config.__isRetry) {
        const queuedRequest = { ...error.config, __isRetry: true };
        failedRequestsQueue.add(queuedRequest);
      }
    }

    return Promise.reject(error);
  }
);

// Listen for online status changes
window.addEventListener("online", async () => {
  console.log("Back online - processing queued requests");

  if (!isRetryingFailedRequests && failedRequestsQueue.size > 0) {
    isRetryingFailedRequests = true;

    // Wait a bit for the connection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const requestsToRetry = Array.from(failedRequestsQueue) as AxiosRequestConfig[];
    failedRequestsQueue.clear();

    for (const config of requestsToRetry) {
      try {
        console.log("Retrying queued request:", config.url);
        await axiosInstance(config);
      } catch (error) {
        console.error("Failed to retry request:", error);
      }
    }

    isRetryingFailedRequests = false;
  }
});

// Function to manually retry all failed requests (can be called from UI)
export const retryFailedRequests = async () => {
  if (isRetryingFailedRequests || !isOnline()) return;

  isRetryingFailedRequests = true;
  const requestsToRetry = Array.from(failedRequestsQueue) as AxiosRequestConfig[];
  failedRequestsQueue.clear();

  for (const config of requestsToRetry) {
    try {
      console.log("Manually retrying request:", config.url);
      await axiosInstance(config);
    } catch (error) {
      console.error("Failed to retry request:", error);
    }
  }

  isRetryingFailedRequests = false;
};
