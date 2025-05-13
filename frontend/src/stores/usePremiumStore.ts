import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface PremiumStatus {
  isPremium: boolean;
  premiumTier: "none" | "basic" | "standard" | "premium";
  premiumSince: Date | null;
  premiumExpiresAt: Date | null;
}

// User details interface for admin components
export interface UserDetails {
  _id: string;
  clerkId: string;
  fullName: string;
  imageUrl: string;
  email: string;
  isPremium: boolean;
  premiumTier: string;
  premiumSince: string;
  premiumExpiresAt: string;
  subscriptionId: string;
  createdAt: string;
}

interface PremiumStore {
  // State
  premiumStatus: PremiumStatus | null;
  isLoading: boolean;
  error: string | null;
  showPremiumPopup: boolean;
  premiumUsers: UserDetails[]; // Now it's an array of UserDetails objects
  allUsers: UserDetails[]; // Array of all users for admin

  // Methods
  checkPremiumStatus: () => Promise<void>;
  upgradeToPremium: (paymentMethod: string, tier?: string) => Promise<boolean>;
  cancelPremium: () => Promise<boolean>;
  setShowPremiumPopup: (show: boolean) => void;
  fetchPremiumUsers: () => Promise<void>;
  fetchAllUsers: () => Promise<void>; // Added function for admin
  reset: () => void;
}

const defaultPremiumStatus: PremiumStatus = {
  isPremium: false,
  premiumTier: "none",
  premiumSince: null,
  premiumExpiresAt: null,
};

// Load cached premium status from localStorage
const getCachedPremiumStatus = (): PremiumStatus | null => {
  try {
    const cached = localStorage.getItem("premiumStatus");
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    // Parse date strings back to Date objects
    if (parsed.premiumSince) {
      parsed.premiumSince = new Date(parsed.premiumSince);
    }
    if (parsed.premiumExpiresAt) {
      parsed.premiumExpiresAt = new Date(parsed.premiumExpiresAt);
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing cached premium status:", error);
    return null;
  }
};

export const usePremiumStore = create<PremiumStore>((set, get) => ({
  premiumStatus: getCachedPremiumStatus(),
  isLoading: false,
  error: null,
  showPremiumPopup: false,
  premiumUsers: [],
  allUsers: [],

  checkPremiumStatus: async () => {
    // If already loading, don't make another request
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader =
        !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't check premium status");
        set({
          premiumStatus: defaultPremiumStatus,
          isLoading: false,
        });
        localStorage.removeItem("premiumStatus");
        return;
      }

      // Also fetch premium users list
      get().fetchPremiumUsers();

      const response = await axiosInstance.get("/premium/status");

      // Parse date strings into Date objects
      const data = response.data;
      if (data.premiumSince) {
        data.premiumSince = new Date(data.premiumSince);
      }
      if (data.premiumExpiresAt) {
        data.premiumExpiresAt = new Date(data.premiumExpiresAt);
      }

      // Cache the premium status in localStorage
      localStorage.setItem("premiumStatus", JSON.stringify(data));

      set({
        premiumStatus: data,
        isLoading: false,
      });

      console.log("Premium status updated:", data);
    } catch (error: any) {
      console.error("Error checking premium status:", error);

      if (error.response?.status === 401) {
        // Not authenticated
        localStorage.removeItem("premiumStatus");
        set({
          premiumStatus: defaultPremiumStatus,
          isLoading: false,
        });
      } else {
        set({
          error:
            error?.response?.data?.message || "Failed to check premium status",
          isLoading: false,
        });
      }
    }
  },

  upgradeToPremium: async (paymentMethod: string, tier = "premium") => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader =
        !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't upgrade to premium");
        set({ isLoading: false });
        return false;
      }

      // Call the premium upgrade endpoint, which will return a response with redirectToPayment=true
      const response = await axiosInstance.post("/premium/upgrade", {
        tier,
      });

      // Set loading to false
      set({ isLoading: false });

      // If the response indicates we should redirect to payment, we return true
      // The actual payment will be handled by the Razorpay component
      if (response.data.redirectToPayment) {
        return true;
      }

      // If we got here, something unexpected happened
      set({ error: "Unexpected response from server" });
      return false;
    } catch (error: any) {
      console.error("Error initiating premium upgrade:", error);
      set({
        error:
          error?.response?.data?.message ||
          "Failed to initiate premium upgrade",
        isLoading: false,
      });
      return false;
    }
  },

  cancelPremium: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader =
        !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't cancel premium");
        set({ isLoading: false });
        return false;
      }

      await axiosInstance.post("/premium/cancel");

      // Clear cache
      localStorage.removeItem("premiumStatus");

      set({
        premiumStatus: defaultPremiumStatus,
        isLoading: false,
      });

      return true;
    } catch (error: any) {
      console.error("Error cancelling premium:", error);
      set({
        error: error?.response?.data?.message || "Failed to cancel premium",
        isLoading: false,
      });
      return false;
    }
  },

  setShowPremiumPopup: (show: boolean) => {
    set({ showPremiumPopup: show });
  },

  fetchPremiumUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/premium/users");
      set({
        premiumUsers: response.data.premiumUsers || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching premium users:", error);
      set({
        error: "Failed to fetch premium users",
        isLoading: false,
      });
    }
  },

  fetchAllUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/admin/users");
      set({
        allUsers: response.data.users || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching all users:", error);
      set({
        error: "Failed to fetch all users",
        isLoading: false,
      });
    }
  },

  reset: () => {
    localStorage.removeItem("premiumStatus");
    set({
      premiumStatus: null,
      isLoading: false,
      error: null,
      showPremiumPopup: false,
      premiumUsers: [],
      allUsers: [],
    });
  },
}));
