import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { axiosInstance } from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

const AdminLoginForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAdminStatus } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/check-admin", { email });
      const { isAdmin } = response.data;

      if (isAdmin) {
        setAdminStatus(true);
        toast.success("Admin access granted!");
        navigate("/admin");
      } else {
        toast.error("Not authorized as admin");
        setAdminStatus(false);
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Failed to verify admin status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-zinc-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-white">Admin Access</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Label htmlFor="email" className="text-white">Admin Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            className="mt-1 bg-zinc-700 text-white border-zinc-600"
            required
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Access Admin Dashboard"}
        </Button>
      </form>
    </div>
  );
};

export default AdminLoginForm;
