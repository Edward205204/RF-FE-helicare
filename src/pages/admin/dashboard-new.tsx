import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  Users,
  UserCheck,
  Bed,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats } from "@/apis/admin.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error: any) {
      toast.error("Không thể tải thống kê bảng điều khiển");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">Đang tải...</p>
      </div>
    );
  }

  const overviewStats = [
    {
      title: "Tổng số cư dân",
      value: stats?.total_residents || 0,
      icon: Users,
      color: "bg-blue-100",
    },
    {
      title: "Cư dân đang hoạt động",
      value: stats?.active_residents || 0,
      icon: UserCheck,
      color: "bg-green-100",
    },
    {
      title: "Nhân viên",
      value: stats?.total_staff || 0,
      icon: UserCheck,
      color: "bg-yellow-100",
    },
    {
      title: "Cảnh báo",
      value: stats?.alerts_count || 0,
      icon: AlertTriangle,
      color: "bg-red-100",
    },
  ];

  return (
    <div className="w-full relative">
      <div className="container mx-auto p-6 space-y-6 bg-transparent">
        <h1 className="text-3xl font-bold text-gray-800">
          Bảng điều khiển tổng quan
        </h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`${stat.color} shadow-md border-gray-300`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Room & Bed Summary */}
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl">Tổng quan Phòng & Giường</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: `${stats?.occupancy_rate || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {stats?.occupancy_rate || 0}%
              </span>
            </div>
            <p className="text-lg mt-2">
              Đang sử dụng: {stats?.occupied_beds || 0} /{" "}
              {stats?.total_beds || 0} giường
            </p>
          </CardContent>
        </Card>

        {/* Tasks Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Tổng công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.total_tasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Đang chờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats?.pending_tasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-300">
            <CardHeader>
              <CardTitle className="text-lg">Hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.completed_tasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border-gray-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate(path.adminResidents)}
                className="h-12 bg-[#5985d8] text-lg text-white hover:bg-[#5183c9]"
              >
                Quản lý cư dân
              </Button>
              <Button
                onClick={() => navigate(path.adminStaff)}
                className="h-12 bg-[#5985d8] text-lg text-white hover:bg-[#5183c9]"
              >
                Quản lý nhân viên
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
