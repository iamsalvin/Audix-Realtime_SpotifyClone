import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import { useActivityStore } from "./useActivityStore";

interface AuthStore {
	isAdmin: boolean;
	isLoading: boolean;
	error: string | null;

	checkAdminStatus: () => Promise<void>;
	setAdminStatus: (status: boolean) => void;
	reset: () => void;
}

// Initialize isAdmin from localStorage if available
const getInitialAdminStatus = () => {
	const storedStatus = localStorage.getItem('isAdmin');
	return storedStatus === 'true';
};

export const useAuthStore = create<AuthStore>((set) => ({
	isAdmin: getInitialAdminStatus(),
	isLoading: false,
	error: null,

	checkAdminStatus: async () => {
		set({ isLoading: true, error: null });
		try {
			console.log("Checking admin status...");
			const response = await axiosInstance.get("/admin/check");
			console.log("Admin check response:", response.data);
			
			// Store admin status in localStorage
			localStorage.setItem('isAdmin', response.data.admin.toString());
			set({ isAdmin: response.data.admin });
		} catch (error: any) {
			console.error("Admin check error:", error);
			
			// Alternative method: Check if email matches admin email
			try {
				const userResponse = await axiosInstance.get("/users/me");
				const userEmail = userResponse.data.email;
				console.log("User email:", userEmail);
				
				// Check if email matches admin email from backend
				const adminCheckResponse = await axiosInstance.post("/auth/check-admin", { email: userEmail });
				const isAdmin = adminCheckResponse.data.isAdmin;
				
				localStorage.setItem('isAdmin', isAdmin.toString());
				set({ isAdmin });
			} catch (userError) {
				console.error("User check error:", userError);
				localStorage.setItem('isAdmin', 'false');
				set({ 
					isAdmin: false, 
					error: error.response?.data?.message || "Failed to check admin status" 
				});
			}
		} finally {
			set({ isLoading: false });
		}
	},

	setAdminStatus: (status: boolean) => {
		localStorage.setItem('isAdmin', status.toString());
		set({ isAdmin: status });
		
		// Reset activity store when admin status changes
		// This ensures fresh data fetch when transitioning to/from admin
		const activityStore = useActivityStore.getState();
		activityStore.reset();
	},

	reset: () => {
		localStorage.removeItem('isAdmin');
		set({ isAdmin: false, isLoading: false, error: null });
	},
}))
