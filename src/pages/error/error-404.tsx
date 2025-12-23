import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Home, AlertCircle } from "lucide-react";
import { AppContext } from "@/contexts/app.context";
import { UserRole } from "@/constants/user-role";
import path from "@/constants/path";

const Error404: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useContext(AppContext);

  const getHomePath = () => {
    if (!isAuthenticated || !profile) {
      return path.signin;
    }

    const userRole = (profile as any).role;
    switch (userRole) {
      case UserRole.Admin:
      case UserRole.RootAdmin:
        return path.adminDashboard;
      case UserRole.Staff:
        return path.residentList;
      case UserRole.Family:
        return path.familyHome;
      case UserRole.Resident:
        return path.residentHome;
      default:
        return path.signin;
    }
  };

  const handleGoHome = () => {
    navigate(getHomePath());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg border-2 border-gray-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-800 mb-2">
            404
          </CardTitle>
          <p className="text-xl font-semibold text-gray-700">
            Trang không tồn tại
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600 leading-relaxed">
            Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
            Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
          </p>
          <Button
            onClick={handleGoHome}
            className="w-full bg-[#5985D8] hover:bg-[#4a70b8] text-white font-medium py-6 text-lg shadow-md transition-all hover:shadow-lg"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            {isAuthenticated ? "Về trang chủ" : "Về trang đăng nhập"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Error404;
