import { useAuthStore } from "@/stores/useAuthStore";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { axiosInstance } from "@/lib/axios";

const AdminAccessButton = () => {
  const { isAdmin, setAdminStatus } = useAuthStore();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isSignedIn, user } = useUser();
  const navigate = useNavigate();

  // Check if user is admin on component mount
  useEffect(() => {
    const checkIfAdmin = async () => {
      try {
        setLoading(true);
        
        // First check if we already know this user is admin
        const storedAdminStatus = localStorage.getItem('isAdmin');
        if (storedAdminStatus === 'true') {
          setIsAdminUser(true);
          setAdminStatus(true);
          setLoading(false);
          return;
        }
        
        // If user email is available, check against admin email
        if (user?.primaryEmailAddress?.emailAddress) {
          const userEmail = user.primaryEmailAddress.emailAddress;
          console.log("Checking if user email is admin:", userEmail);
          
          try {
            const response = await axiosInstance.post("/auth/check-admin", { 
              email: userEmail 
            });
            
            console.log("Admin check response:", response.data);
            
            if (response.data.isAdmin) {
              setIsAdminUser(true);
              setAdminStatus(true);
              localStorage.setItem('isAdmin', 'true');
            }
          } catch (error) {
            console.error("Admin check error:", error);
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      checkIfAdmin();
    } else {
      setLoading(false);
      setIsAdminUser(false);
      localStorage.removeItem('isAdmin');
      setAdminStatus(false);
    }
  }, [isSignedIn, user, setAdminStatus]);

  // Don't show button if not signed in or if not admin and not loading
  if (!isSignedIn || (!isAdminUser && !isAdmin && !loading)) {
    return null;
  }

  const handleAdminAccess = () => {
    navigate("/admin");
  };

  return (
    <Button 
      onClick={handleAdminAccess}
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
      disabled={loading}
    >
      <ShieldCheck className="mr-2 h-4 w-4" />
      {loading ? "Checking..." : "Access Admin Dashboard"}
    </Button>
  );
};

export default AdminAccessButton;
