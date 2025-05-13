import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const updateApiToken = (token: string | null) => {
  if (token)
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete axiosInstance.defaults.headers.common["Authorization"];
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const { checkAdminStatus } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();

  // Function to handle auth initialization with retries
  const initAuthWithRetry = async (retryCount = 0, maxRetries = 3) => {
    try {
      // If user is not signed in, we can skip the token retrieval process
      if (!isSignedIn) {
        console.log("No user signed in, proceeding as guest");
        // Clear any existing token
        updateApiToken(null);
        setLoading(false);
        return;
      }

      const token = await getToken();

      if (!token && retryCount < maxRetries && isSignedIn) {
        // If no token but we have retries left, wait and try again
        console.log(
          `No token yet, retrying (${retryCount + 1}/${maxRetries})...`
        );
        setTimeout(() => initAuthWithRetry(retryCount + 1, maxRetries), 1000);
        return;
      }

      updateApiToken(token);

      if (token) {
        // Ensure user data is available before proceeding
        if (user && user.id) {
          // Sync user data with backend
          try {
            await axiosInstance.post("/auth/callback", {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl,
              email: user.primaryEmailAddress?.emailAddress,
            });
            console.log("User data synced with backend");
          } catch (syncError) {
            console.error("Error syncing user data:", syncError);
          }

          // Check admin status and initialize socket
          await checkAdminStatus();
          if (userId) initSocket(userId);
        } else if (retryCount < maxRetries) {
          // If user data isn't available yet, retry
          console.log(
            `User data not ready, retrying (${retryCount + 1}/${maxRetries})...`
          );
          setTimeout(() => initAuthWithRetry(retryCount + 1, maxRetries), 1000);
          return;
        }
      }
    } catch (error: any) {
      updateApiToken(null);
      console.error("Error in auth provider:", error);

      // Show error toast only on final attempt
      if (retryCount >= maxRetries - 1) {
        toast.error("Authentication error. Please try again.");
      } else if (retryCount < maxRetries) {
        // Retry on error
        console.log(
          `Auth error, retrying (${retryCount + 1}/${maxRetries})...`
        );
        setTimeout(() => initAuthWithRetry(retryCount + 1, maxRetries), 1000);
        return;
      }
    } finally {
      // Always set loading to false after all retries or successful auth
      if (retryCount >= maxRetries - 1 || !isSignedIn) {
        console.log("Auth process complete, exiting loading state");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Start auth process when user data loading state is determined
    if (isUserLoaded) {
      console.log("User data loaded, initializing auth");
      initAuthWithRetry();
    } else {
      // Set a timeout to prevent infinite loading if Clerk doesn't load
      const timeout = setTimeout(() => {
        console.log("Clerk loading timeout, proceeding anyway");
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    // clean up
    return () => disconnectSocket();
  }, [
    getToken,
    userId,
    user,
    isUserLoaded,
    isSignedIn,
    checkAdminStatus,
    initSocket,
    disconnectSocket,
  ]);

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader className="size-8 text-emerald-500 animate-spin" />
      </div>
    );

  return <>{children}</>;
};
export default AuthProvider;
