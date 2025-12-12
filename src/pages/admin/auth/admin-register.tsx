import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { toast } from "react-toastify";
import { adminRegister, getAdminMe } from "@/apis/admin.api";
import path from "@/constants/path";

const AdminRegister: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRootAdmin, setIsRootAdmin] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await getAdminMe();
      if (response.data.role === "RootAdmin") {
        setIsRootAdmin(true);
      } else {
        toast.error("Only RootAdmin can create an Admin");
        navigate(path.adminDashboard);
      }
    } catch (error) {
      toast.error("Unable to verify permission");
      navigate(path.adminLogin);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password confirmation does not match");
      return;
    }

    try {
      setLoading(true);
      await adminRegister({
        email,
        password,
        confirm_password: confirmPassword,
        institution_id: "", // Will be set from token
      });
      toast.success("Admin created successfully");
      navigate(path.adminStaff);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Create Admin failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isRootAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto bg-white border-gray-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div className="flex space-x-4">
              <Button
                type="submit"
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Admin"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(path.adminStaff)}
                className="border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegister;
