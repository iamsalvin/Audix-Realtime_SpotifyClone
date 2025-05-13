import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import { useActivityStore } from "./useActivityStore";

interface AuthStore {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;

  checkAdminStatus: () => Promise<boolean>;
  setAdminStatus: (status: boolean) => void;
  reset: () => void;
}

// Initialize isAdmin from localStorage if available
const getInitialAdminStatus = () => {
  const storedStatus = localStorage.getItem("isAdmin");
  return storedStatus === "true";
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAdmin: getInitialAdminStatus(),
  isLoading: false,
  error: null,

  checkAdminStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log("Checking admin status...");

      // Try to get the current user's email first
      const userResponse = await axiosInstance.get("/users/me");
      const userEmail = userResponse.data.email;
      console.log("User email:", userEmail);

      if (!userEmail) {
        console.error("No user email found");
        set({ isAdmin: false, isLoading: false });
        return false;
      }

      // Check if email matches admin email directly first
      const adminCheckResponse = await axiosInstance.post("/auth/check-admin", {
        email: userEmail,
      });

      const isAdmin = adminCheckResponse.data.isAdmin;
      console.log("Admin check via email:", isAdmin);

      // Store in localStorage and update state
      localStorage.setItem("isAdmin", isAdmin.toString());
      set({ isAdmin, isLoading: false });

      // If they're an admin, also make a call to the protected admin check
      // This helps ensure the session is properly set up
      if (isAdmin) {
        try {
          const protectedCheckResponse = await axiosInstance.get(
            "/admin/check"
          );
          console.log(
            "Protected admin check response:",
            protectedCheckResponse.data
          );
        } catch (err) {
          console.warn(
            "Protected admin check failed, but user is still admin based on email"
          );
        }
      }

      return isAdmin;
    } catch (error: any) {
      console.error("Admin check error:", error);

      // Fallback to direct admin check as a last resort
      try {
        const response = await axiosInstance.get("/admin/check");
        console.log("Direct admin check response:", response.data);

        localStorage.setItem("isAdmin", "true");
        set({ isAdmin: true, isLoading: false });
        return true;
      } catch (directError) {
        console.error("Direct admin check failed:", directError);

        // Ensure we don't lock out an admin if there's just a temporary issue
        const currentAdminStatus = getInitialAdminStatus();
        if (currentAdminStatus) {
          console.log("Maintaining existing admin status due to error");
          set({ isLoading: false });
          return true;
        } else {
          localStorage.setItem("isAdmin", "false");
          set({
            isAdmin: false,
            error:
              error.response?.data?.message || "Failed to check admin status",
            isLoading: false,
          });
          return false;
        }
      }
    }
  },

  setAdminStatus: (status: boolean) => {
    localStorage.setItem("isAdmin", status.toString());
    set({ isAdmin: status });

    // Reset activity store when admin status changes
    // This ensures fresh data fetch when transitioning to/from admin
    const activityStore = useActivityStore.getState();
    activityStore.reset();
  },

  reset: () => {
    localStorage.removeItem("isAdmin");
    set({ isAdmin: false, isLoading: false, error: null });
  },
}));
