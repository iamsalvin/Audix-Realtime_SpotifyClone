import { useAuthStore } from "@/stores/useAuthStore";
import Header from "./components/Header";
import DashboardStats from "./components/DashboardStats";
import { Album, Crown, Music, Users2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SongsTabContent from "./components/SongsTabContent";
import AlbumsTabContent from "./components/AlbumsTabContent";
import UsersTabContent from "./components/UsersTabContent";
import AllUsersTabContent from "./components/AllUsersTabContent";
import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { useNavigate } from "react-router-dom";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { toast } from "react-hot-toast";

const AdminPage = () => {
  const { isAdmin, isLoading, setAdminStatus, checkAdminStatus } =
    useAuthStore();
  const [adminChecked, setAdminChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  const { fetchAlbums, fetchAdminSongs } = useMusicStore();
  const { fetchPremiumUsers, fetchAllUsers } = usePremiumStore();

  // First check admin status explicitly when the page loads
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        // Check localStorage directly as a fallback
        const storedAdminStatus = localStorage.getItem("isAdmin");
        if (storedAdminStatus === "true" && !isAdmin) {
          console.log("Setting admin status from localStorage");
          setAdminStatus(true);
        }

        // Then explicitly check with the server
        const isVerifiedAdmin = await checkAdminStatus();
        console.log("Admin status verified:", isVerifiedAdmin);
        setAdminChecked(true);
      } catch (err) {
        console.error("Error verifying admin status:", err);
        setAdminChecked(true); // Still mark as checked so we can show the retry button
      }
    };

    verifyAdmin();
  }, [checkAdminStatus, isAdmin, setAdminStatus]);

  // Fetch data when admin status is confirmed
  useEffect(() => {
    if (isAdmin) {
      console.log("Admin confirmed - loading dashboard data");

      // Single loading indicator that won't be duplicated
      const loadingToast = toast.loading("Loading dashboard data...", {
        id: "admin-data-loading",
        duration: 3000, // Auto-dismiss after 3 seconds
      });

      // Load admin data silently in the background
      Promise.all([
        fetchAlbums(),
        fetchAdminSongs(),
        fetchPremiumUsers(),
        fetchAllUsers(),
      ]).catch((error) => {
        console.error("Error loading admin data:", error);
        // Only show error toasts, not success toasts
        toast.error("Some data failed to load", {
          id: "admin-data-loading",
        });
      });
    }
  }, [isAdmin, fetchAlbums, fetchAdminSongs, fetchPremiumUsers, fetchAllUsers]);

  // Handle retry for admin verification with silent notifications
  const handleRetryAdminVerification = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    try {
      // Use a single toast with an ID to prevent duplicates
      const verifyToastId = "admin-verification";
      toast.loading("Verifying admin status...", { id: verifyToastId });

      const isVerifiedAdmin = await checkAdminStatus();

      if (isVerifiedAdmin) {
        toast.success("Verification successful", { id: verifyToastId });
      } else {
        toast.error("Verification failed", { id: verifyToastId });
        navigate("/admin-login");
      }
    } catch (err) {
      console.error("Error during retry:", err);
      // Use a unique toast ID for the error to prevent duplicates
      toast.error("Verification failed", { id: "verify-error" });
    } finally {
      setIsRetrying(false);
    }
  };

  // Navigate to admin login if not admin after checking
  useEffect(() => {
    if (adminChecked && !isAdmin && !isLoading && retryCount === 0) {
      console.log("Not authorized as admin, redirecting to login");
      navigate("/admin-login");
    }
  }, [adminChecked, isAdmin, isLoading, navigate, retryCount]);

  // Show loading state while checking admin status
  if (!adminChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center">
        <p className="text-zinc-100 text-xl">Loading admin dashboard...</p>
      </div>
    );
  }

  // Show retry option if admin check failed
  if (!isAdmin && adminChecked && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-zinc-100 text-xl text-center">
          Unable to verify admin status
        </p>
        <p className="text-zinc-400 text-center max-w-md">
          There was a problem verifying your admin credentials. This could be
          due to a network issue or session timeout.
        </p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRetryAdminVerification}
            disabled={isRetrying}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {isRetrying ? "Retrying..." : "Retry Verification"}
          </button>
          <button
            onClick={() => navigate("/admin-login")}
            className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8"
    >
      <Header />

      <DashboardStats />

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="p-1 bg-zinc-800/50">
          <TabsTrigger
            value="songs"
            className="data-[state=active]:bg-zinc-700"
          >
            <Music className="mr-2 size-4" />
            Songs
          </TabsTrigger>
          <TabsTrigger
            value="albums"
            className="data-[state=active]:bg-zinc-700"
          >
            <Album className="mr-2 size-4" />
            Albums
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-zinc-700"
          >
            <Users2 className="mr-2 size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="data-[state=active]:bg-zinc-700"
          >
            <Crown className="mr-2 size-4" />
            Premium Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs">
          <SongsTabContent />
        </TabsContent>
        <TabsContent value="albums">
          <AlbumsTabContent />
        </TabsContent>
        <TabsContent value="users">
          <AllUsersTabContent />
        </TabsContent>
        <TabsContent value="subscriptions">
          <UsersTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
