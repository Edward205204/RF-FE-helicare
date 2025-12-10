import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStaffPerformance,
  getStaffById,
  type StaffPerformanceResponse,
  type StaffDetailResponse,
} from "@/apis/staff.api";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
} from "lucide-react";
import path from "@/constants/path";

export default function StaffPerformance(): React.JSX.Element {
  const { staff_id } = useParams<{ staff_id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffDetailResponse | null>(null);
  const [performance, setPerformance] =
    useState<StaffPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (!staff_id) {
      toast.error("Staff ID không hợp lệ");
      navigate(path.staffList);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffResponse, performanceResponse] = await Promise.all([
          getStaffById(staff_id),
          getStaffPerformance(staff_id, selectedMonth),
        ]);
        setStaff(staffResponse.data);
        setPerformance(performanceResponse.data);
      } catch (error: any) {
        console.error("Error fetching performance:", error);
        toast.error(
          error.response?.data?.message || "Không thể tải thông tin performance"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [staff_id, selectedMonth, navigate]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case "A":
        return "text-green-600 bg-green-50";
      case "B":
        return "text-yellow-600 bg-yellow-50";
      case "C":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5985d8]" />
      </div>
    );
  }

  if (!staff || !performance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Không tìm thấy thông tin performance</p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              navigate(path.staffDetail.replace(":staff_id", staff_id!))
            }
            className="border-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Hiệu suất Nhân viên
            </h1>
            <p className="mt-1 text-sm text-gray-600">{staff.full_name}</p>
          </div>
        </div>

        {/* Month Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="month-select" className="text-sm font-medium">
                Chọn tháng:
              </Label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="w-48 border border-gray-200 bg-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Nhiệm vụ đã hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {performance.tasks_completed}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Nhiệm vụ trễ hạn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {performance.tasks_late}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Đánh giá đã hoàn thành
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {performance.assessments_completed}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Cảnh báo đã xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {performance.alerts_handled}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Xếp hạng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-yellow-600" />
                <div
                  className={`px-6 py-4 rounded-lg ${getRankingColor(
                    performance.ranking
                  )}`}
                >
                  <p className="text-4xl font-bold">{performance.ranking}</p>
                  <p className="text-sm mt-1">
                    {performance.ranking === "A"
                      ? "Hiệu suất xuất sắc"
                      : performance.ranking === "B"
                      ? "Hiệu suất tốt"
                      : "Cần cải thiện"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
