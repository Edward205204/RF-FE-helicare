import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Alert, AlertDescription } from "@/components/ui";
import { changePassword } from "@/apis/auth.api";
import { toast } from "react-toastify";
import path from "@/constants/path";
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react";

const ResidentChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<{
    current_password?: string;
    new_password?: string;
    confirm_password?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.current_password.trim()) {
      newErrors.current_password = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!formData.new_password.trim()) {
      newErrors.new_password = "Vui lòng nhập mật khẩu mới";
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(
        formData.new_password
      )
    ) {
      newErrors.new_password =
        "Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Mật khẩu xác nhận không khớp";
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      toast.success("Đổi mật khẩu thành công!");
      setFormData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      
      // Redirect after 1 second
      setTimeout(() => {
        navigate(path.residentHome);
      }, 1000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.";
      
      if (errorMessage.includes("current password") || errorMessage.includes("mật khẩu hiện tại")) {
        setErrors({ current_password: "Mật khẩu hiện tại không đúng" });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Đổi Mật Khẩu
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-sm font-medium text-gray-700">
                  Mật khẩu hiện tại *
                </Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.current_password}
                    onChange={(e) =>
                      setFormData({ ...formData, current_password: e.target.value })
                    }
                    className={`border-gray-200 shadow-none bg-white pr-10 ${
                      errors.current_password ? "border-red-300" : ""
                    }`}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.current_password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.current_password}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-sm font-medium text-gray-700">
                  Mật khẩu mới *
                </Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.new_password}
                    onChange={(e) =>
                      setFormData({ ...formData, new_password: e.target.value })
                    }
                    className={`border-gray-200 shadow-none bg-white pr-10 ${
                      errors.new_password ? "border-red-300" : ""
                    }`}
                    placeholder="Nhập mật khẩu mới"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.new_password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.new_password}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu mới *
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) =>
                      setFormData({ ...formData, confirm_password: e.target.value })
                    }
                    className={`border-gray-200 shadow-none bg-white pr-10 ${
                      errors.confirm_password ? "border-red-300" : ""
                    }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirm_password}
                  </p>
                )}
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Sau khi đổi mật khẩu thành công, bạn sẽ cần đăng nhập lại với mật khẩu mới.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(path.residentHome)}
                  className="flex-1 border-gray-200"
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResidentChangePassword;

