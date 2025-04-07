import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

interface PremiumStatus {
  isPremium: boolean;
  premiumTier: 'none' | 'basic' | 'standard' | 'premium';
  premiumSince: Date | null;
  premiumExpiresAt: Date | null;
}

interface PremiumStore {
  // State
  premiumStatus: PremiumStatus | null;
  isLoading: boolean;
  error: string | null;
  showPremiumPopup: boolean;
  premiumUsers: string[]; // Array of user IDs who have premium status
  
  // Methods
  checkPremiumStatus: () => Promise<void>;
  upgradeToPremium: (paymentMethod: string, tier?: string) => Promise<boolean>;
  cancelPremium: () => Promise<boolean>;
  setShowPremiumPopup: (show: boolean) => void;
  fetchPremiumUsers: () => Promise<void>;
  reset: () => void;
}

const defaultPremiumStatus: PremiumStatus = {
  isPremium: false,
  premiumTier: 'none',
  premiumSince: null,
  premiumExpiresAt: null
};

export const usePremiumStore = create<PremiumStore>((set, get) => ({
  premiumStatus: null,
  isLoading: false,
  error: null,
  showPremiumPopup: false,
  premiumUsers: [],
  
  checkPremiumStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader = !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't check premium status");
        set({ 
          premiumStatus: defaultPremiumStatus,
          isLoading: false 
        });
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
      
      set({ 
        premiumStatus: data,
        isLoading: false 
      });
      
      console.log("Premium status:", data);
    } catch (error: any) {
      console.error("Error checking premium status:", error);
      
      if (error.response?.status === 401) {
        // Not authenticated
        set({ 
          premiumStatus: defaultPremiumStatus,
          isLoading: false 
        });
      } else {
        set({ 
          error: error?.response?.data?.message || "Failed to check premium status",
          isLoading: false 
        });
      }
    }
  },
  
  upgradeToPremium: async (paymentMethod: string, tier = 'premium') => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader = !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't upgrade to premium");
        set({ isLoading: false });
        return false;
      }
      
      const response = await axiosInstance.post("/premium/upgrade", {
        paymentMethod,
        tier
      });
      
      // Parse date strings into Date objects
      const data = response.data;
      if (data.premiumSince) {
        data.premiumSince = new Date(data.premiumSince);
      }
      if (data.premiumExpiresAt) {
        data.premiumExpiresAt = new Date(data.premiumExpiresAt);
      }
      
      set({ 
        premiumStatus: {
          isPremium: data.isPremium,
          premiumTier: data.premiumTier,
          premiumSince: data.premiumSince,
          premiumExpiresAt: data.premiumExpiresAt
        },
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      console.error("Error upgrading to premium:", error);
      set({ 
        error: error?.response?.data?.message || "Failed to upgrade to premium",
        isLoading: false 
      });
      return false;
    }
  },
  
  cancelPremium: async () => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated
      const hasAuthHeader = !!axiosInstance.defaults.headers.common["Authorization"];
      if (!hasAuthHeader) {
        console.log("User not authenticated, can't cancel premium");
        set({ isLoading: false });
        return false;
      }
      
      await axiosInstance.post("/premium/cancel");
      
      set({ 
        premiumStatus: defaultPremiumStatus,
        isLoading: false 
      });
      
      return true;
    } catch (error: any) {
      console.error("Error cancelling premium:", error);
      set({ 
        error: error?.response?.data?.message || "Failed to cancel premium",
        isLoading: false 
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
      const response = await axiosInstance.get('/premium/users');
      set({ 
        premiumUsers: response.data.premiumUsers || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching premium users:', error);
      set({ 
        error: 'Failed to fetch premium users',
        isLoading: false 
      });
    }
  },
  
  reset: () => {
    set({
      premiumStatus: null,
      isLoading: false,
      error: null,
      showPremiumPopup: false,
      premiumUsers: []
    });
  }
}));
