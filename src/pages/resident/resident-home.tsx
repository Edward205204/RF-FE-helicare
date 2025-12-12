import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  AlertTriangle,
  User,
  Activity,
  Utensils,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { getResidentDashboardData } from "@/apis/resident.api";
import { toast } from "react-toastify";
import path from "@/constants/path";

const ResidentHome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getResidentDashboardData();
        if (response.data) {
          setDashboardData(response.data);
        } else {
          toast.error("Information not found.");
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error(
            error.response?.data?.message ||
              "Không thể tải dữ liệu. Vui lòng thử lại sau."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadgeStyles = (status: string) => {
    if (status === "completed" || status === "Completed") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (status === "pending" || status === "Pending") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    if (status === "Ongoing") {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusText = (status: string) => {
    if (status === "completed" || status === "Completed")
      return "Đã hoàn thành";
    if (status === "pending" || status === "Pending") return "Đang chờ";
    if (status === "Ongoing") return "Đang diễn ra";
    if (status === "Upcoming") return "Sắp tới";
    return status;
  };

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-l-red-500 text-red-900";
      case "warning":
        return "bg-amber-50 border-l-amber-500 text-amber-900";
      default:
        return "bg-blue-50 border-l-blue-500 text-blue-900";
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#5985D8]" />
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">Không tìm thấy thông tin.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { resident, todaySchedules, latestVitals, healthAlerts } =
    dashboardData;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <div>
            <h1 className="text-3xl font-bold text-[#5985D8] tracking-tight">
              Trang chủ
            </h1>
            <p className="text-slate-500 mt-1">
              Chào mừng trở lại, {resident?.full_name || "Cư dân"}.
            </p>
          </div>

          {/* RESIDENT OVERVIEW CARD */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                <User className="w-5 h-5 text-[#5985D8]" /> Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl border-2 border-white shadow-sm">
                      {resident?.full_name?.charAt(0) || "R"}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {resident?.full_name || "Resident"}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium">
                        {resident?.room
                          ? `Phòng ${resident.room.room_number}`
                          : "Chưa có phòng"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {latestVitals && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase mb-2 block">
                        Chỉ số sinh tồn mới nhất
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {latestVitals.blood_pressure_systolic &&
                          latestVitals.blood_pressure_diastolic && (
                            <div className="text-center bg-white rounded-lg p-2">
                              <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                                Huyết áp
                              </span>
                              <span className="font-bold text-slate-700 text-base">
                                {latestVitals.blood_pressure_systolic}/
                                {latestVitals.blood_pressure_diastolic}
                              </span>
                            </div>
                          )}
                        {latestVitals.heart_rate && (
                          <div className="text-center bg-white rounded-lg p-2">
                            <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                              Nhịp tim
                            </span>
                            <span className="font-bold text-slate-700 text-base">
                              {latestVitals.heart_rate} bpm
                            </span>
                          </div>
                        )}
                        {latestVitals.temperature_c && (
                          <div className="text-center bg-white rounded-lg p-2">
                            <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                              Nhiệt độ
                            </span>
                            <span className="font-bold text-slate-700 text-base">
                              {latestVitals.temperature_c.toFixed(1)}°C
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Activity Timeline */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-400" /> Lịch trình hôm
                    nay
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {todaySchedules && todaySchedules.length > 0 ? (
                    <ScrollArea className="h-[320px] pr-4">
                      <div className="relative border-l-2 border-gray-100 ml-3 space-y-0 py-2">
                        {todaySchedules.map((schedule: any, idx: number) => {
                          const startTime = formatTime(schedule.start_time);
                          const isCompleted =
                            schedule.status === "completed" ||
                            schedule.status === "Completed";
                          const isOngoing = schedule.status === "Ongoing";

                          return (
                            <div
                              key={idx}
                              className="mb-8 ml-6 relative last:mb-0"
                            >
                              <span
                                className={`absolute -left-[33px] top-3 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white shadow-sm z-10 ${
                                  isCompleted
                                    ? "bg-emerald-500"
                                    : isOngoing
                                    ? "bg-blue-500"
                                    : "bg-slate-300"
                                }`}
                              ></span>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                                    <Activity size={16} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">
                                      {startTime}
                                    </p>
                                    <p className="text-sm text-slate-600 font-medium">
                                      {schedule.title}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className={`w-fit border-0 shadow-none cursor-default px-3 ${getStatusBadgeStyles(
                                    schedule.status
                                  )}`}
                                >
                                  {getStatusText(schedule.status)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <CalendarIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-base font-semibold text-slate-600">
                          Không có hoạt động nào được lên lịch cho hôm nay
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Alerts */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-3">
                  <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh
                    báo
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {healthAlerts && healthAlerts.length > 0 ? (
                    healthAlerts.map((alert: any, idx: number) => (
                      <div
                        key={alert.id || idx}
                        className={`p-3 rounded-lg border-l-4 shadow-sm flex gap-3 items-start ${getAlertStyles(
                          alert.severity
                        )}`}
                      >
                        <AlertTriangle className="w-5 h-5 mt-0.5 opacity-80 shrink-0" />
                        <div>
                          <p className="font-bold text-sm">
                            {alert.severity === "critical"
                              ? "Cảnh báo nguy hiểm"
                              : alert.severity === "warning"
                              ? "Cảnh báo"
                              : "Thông báo"}
                          </p>
                          <p className="text-xs opacity-90 leading-tight mt-1">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      <p>Không có cảnh báo</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentHome;
