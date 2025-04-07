import AdminLoginForm from "@/components/AdminLoginForm";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminLoginPage = () => {
  const { isAdmin } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to admin dashboard if already authenticated as admin
  useEffect(() => {
    if (isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Audix Admin</h1>
          <p className="text-zinc-400">Enter your admin email to access the dashboard</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
};

export default AdminLoginPage;
