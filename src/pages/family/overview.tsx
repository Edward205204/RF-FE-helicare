import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  AlertTriangle,
  User,
  Activity,
  Utensils,
  Calendar as CalendarIcon,
  Loader2,
  CalendarDays,
} from "lucide-react";
import {
  getFamilyDashboardData,
  getResidentsByFamily,
} from "@/apis/resident.api";
import { toast } from "react-toastify";
import path from "@/constants/path";

// --- COMPONENT ---
const FamilyOverview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");

  // Fetch residents list
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await getResidentsByFamily();
        const residentsList = response.data || [];
        setResidents(residentsList);

        // Set default selected resident (first one) if list is not empty
        if (residentsList.length > 0) {
          setSelectedResidentId((prev) => prev || residentsList[0].resident_id);
        }
      } catch (error: any) {
        console.error("Error fetching residents:", error);
      }
    };

    fetchResidents();
  }, []);

  // Fetch dashboard data when resident is selected
  useEffect(() => {
    // Auto-select first resident if available and none selected
    if (!selectedResidentId && residents.length > 0) {
      setSelectedResidentId(residents[0].resident_id);
      return;
    }

    // Don't fetch if no resident selected
    if (!selectedResidentId) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getFamilyDashboardData(selectedResidentId);
        if (response.data) {
          setDashboardData(response.data);
        } else {
          toast.error(
            "Không tìm thấy thông tin cư dân. Vui lòng liên kết với cư dân trước."
          );
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          toast.error(
            error.response?.data?.message ||
              "Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedResidentId, residents]);

  const getStatusBadgeStyles = (status: string) => {
    if (status === "completed" || status === "Completed") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200";
    }
    if (status === "pending" || status === "Pending") {
      return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
    }
    if (status === "Ongoing") {
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
  };

  const getStatusText = (status: string) => {
    if (status === "completed" || status === "Completed")
      return "Đã hoàn thành";
    if (status === "pending" || status === "Pending") return "Đang chờ";
    if (status === "Ongoing") return "Đang diễn ra";
    if (status === "Upcoming") return "Sắp tới";
    if (status === "Ended") return "Đã kết thúc";
    if (status === "Cancelled") return "Đã hủy";
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
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (timeString) {
      return `${formatDate(dateString)} ${timeString}`;
    }
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
      <div className="min-h-screen bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)] p-4 md:p-8 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#5985D8]" />
          <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)] p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">
                Không tìm thấy cư dân. Vui lòng liên kết với cư dân trước.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { resident, latestVisit, todaySchedules, latestVitals, healthAlerts } =
    dashboardData;

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)] p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-3xl font-bold text-[#5985D8] tracking-tight">
              Tổng quan gia đình
            </h1>
            <p className="text-slate-500 mt-1">
              Chào mừng trở lại, đây là những cập nhật mới nhất cho{" "}
              {resident.full_name}.
            </p>
          </div>
          {residents.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Chọn người thân:
              </label>
              <Select
                value={selectedResidentId}
                onValueChange={setSelectedResidentId}
              >
                <SelectTrigger className="w-[200px] bg-white border-slate-200">
                  <SelectValue placeholder="Chọn người thân" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.resident_id} value={r.resident_id}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* RESIDENT OVERVIEW CARD */}
        <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 border-b border-slate-100/50">
            <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
              <User className="w-5 h-5 text-[#5985D8]" /> Thông tin cư dân
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl border-2 border-white shadow-sm ring-1 ring-slate-200">
                    {resident.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {resident.full_name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {resident.room
                        ? `Phòng ${resident.room.room_number}`
                        : "Chưa có phòng"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">
                      Tuổi
                    </span>
                    <span className="font-semibold text-slate-700">
                      {resident.age} tuổi
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="block text-slate-400 text-xs uppercase font-bold mb-1">
                      Giới tính
                    </span>
                    <span className="font-semibold text-slate-700">
                      {resident.gender === "male" ? "Nam" : "Nữ"}
                    </span>
                  </div>
                </div>
                {(resident.chronicDiseases.length > 0 ||
                  resident.allergies.length > 0) && (
                  <div className="space-y-2">
                    {resident.chronicDiseases.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase mb-1 block">
                          Bệnh mãn tính
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {resident.chronicDiseases.map((disease: any) => (
                            <Badge
                              key={disease.id}
                              className="px-3 py-1.5 rounded-full font-medium border-0 cursor-default shadow-none bg-amber-100 text-amber-700 border-amber-200"
                            >
                              {disease.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {resident.allergies.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase mb-1 block">
                          Dị ứng
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {resident.allergies.map((allergy: any) => (
                            <Badge
                              key={allergy.id}
                              className="px-3 py-1.5 rounded-full font-medium border-0 cursor-default shadow-none bg-rose-100 text-rose-700 border-rose-200"
                            >
                              {allergy.substance}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Vitals & Flags */}
              <div className="space-y-4">
                {latestVitals && (
                  <div className="p-4 rounded-xl bg-[#f0f7ff] border border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Activity size={60} className="text-blue-500" />
                    </div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        Chỉ số sinh tồn mới nhất
                      </span>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-full text-blue-400 shadow-sm">
                        {formatDateTime(latestVitals.measured_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm relative z-10">
                      {latestVitals.blood_pressure_systolic &&
                        latestVitals.blood_pressure_diastolic && (
                          <div className="text-center bg-white/60 rounded-lg p-2 backdrop-blur-sm">
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
                        <div className="text-center bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                            Nhịp tim
                          </span>
                          <span className="font-bold text-slate-700 text-base">
                            {latestVitals.heart_rate} bpm
                          </span>
                        </div>
                      )}
                      {latestVitals.temperature_c && (
                        <div className="text-center bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                            Nhiệt độ
                          </span>
                          <span className="font-bold text-slate-700 text-base">
                            {latestVitals.temperature_c.toFixed(1)}°C
                          </span>
                        </div>
                      )}
                      {latestVitals.oxygen_saturation && (
                        <div className="text-center bg-white/60 rounded-lg p-2 backdrop-blur-sm">
                          <span className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                            SpO₂
                          </span>
                          <span className="font-bold text-slate-700 text-base">
                            {latestVitals.oxygen_saturation}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!latestVitals && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                      Không có dữ liệu chỉ số sinh tồn
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* --- LEFT COLUMN (2/3 width) --- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Activity Timeline */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" /> Lịch trình hôm
                  nay
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {todaySchedules.length > 0 ? (
                  <ScrollArea className="h-[320px] pr-4">
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-0 py-2">
                      {todaySchedules.map((schedule: any, idx: number) => {
                        const startTime = formatTime(schedule.start_time);
                        const isCompleted =
                          schedule.status === "completed" ||
                          schedule.status === "Completed";
                        const isOngoing = schedule.status === "Ongoing";
                        const isMeal =
                          schedule.type === "Meal" ||
                          schedule.title.toLowerCase().includes("ăn") ||
                          schedule.title.toLowerCase().includes("bữa");

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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    isMeal
                                      ? "bg-orange-50 text-orange-500"
                                      : schedule.type === "Care"
                                      ? "bg-blue-50 text-blue-500"
                                      : "bg-purple-50 text-purple-500"
                                  }`}
                                >
                                  {isMeal ? (
                                    <Utensils size={16} />
                                  ) : schedule.type === "Care" ? (
                                    <Activity size={16} />
                                  ) : (
                                    <CalendarIcon size={16} />
                                  )}
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
                        <CalendarDays className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-slate-600">
                          Không có hoạt động nào hôm nay
                        </p>
                        <p className="text-sm text-slate-400 max-w-md">
                          Hôm nay là ngày nghỉ. Bạn có thể xem lịch trình hàng
                          tuần hoặc đặt lịch thăm.
                        </p>
                      </div>
                      <Button
                        onClick={() => navigate(path.familySchedule)}
                        variant="outline"
                        className="mt-2 border-[#5985D8] text-[#5985D8] hover:bg-[#5985D8] hover:text-white"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Xem lịch trình
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN (1/3 width) - FIXED --- */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            {/* Visit Management Card - FIXED UI */}
            <div className="rounded-xl bg-white shadow-sm border-none flex flex-col">
              {/* Custom Header with Rounded Top */}
              <div className="bg-blue-50/50 p-5 rounded-t-xl border-b border-blue-100/50">
                <h3 className="text-lg font-bold text-[#5985D8] flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" /> Quản lý thăm viếng
                </h3>
              </div>

              {/* Content with proper padding */}
              <div className="p-5 space-y-6">
                {/* Next Visit Box - Explicit Styling */}
                <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100 shadow-sm">
                  <p className="text-[11px] text-slate-400 uppercase font-extrabold tracking-widest mb-2">
                    Chuyến thăm gần nhất
                  </p>
                  {latestVisit ? (
                    <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-lg border border-slate-100/50 shadow-sm px-4">
                      <Clock className="w-4 h-4 text-[#5985D8]" />
                      <p className="text-lg font-bold text-slate-800 whitespace-nowrap">
                        {formatDateTime(
                          latestVisit.visit_date,
                          latestVisit.visit_time
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white p-2 rounded-lg border border-slate-100/50 shadow-sm">
                      <p className="text-sm text-slate-500">
                        Không có chuyến thăm sắp tới
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => navigate(path.familySchedule)}
                  className="w-full bg-[#5985D8] hover:bg-[#4a70b8] text-white cursor-pointer shadow-md transition-all hover:shadow-lg h-12 text-base font-medium rounded-lg"
                >
                  Đặt lịch thăm mới
                </Button>
              </div>
            </div>

            {/* Alerts */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50 pb-3">
                <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo
                  sức khỏe
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {healthAlerts.length > 0 ? (
                  healthAlerts.map((alert: any, idx: number) => (
                    <div
                      key={alert.id || idx}
                      className={`p-3 rounded-lg border-l-4 shadow-sm flex gap-3 items-start transition-transform hover:translate-x-1 ${getAlertStyles(
                        alert.severity
                      )}`}
                    >
                      <AlertTriangle className="w-5 h-5 mt-0.5 opacity-80 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">
                          {alert.severity === "critical"
                            ? "Cảnh báo khẩn cấp"
                            : alert.severity === "warning"
                            ? "Cảnh báo"
                            : "Thông báo"}
                        </p>
                        <p className="text-xs opacity-90 leading-tight mt-1">
                          {alert.message}
                        </p>
                        {alert.recommendation && (
                          <p className="text-xs opacity-75 leading-tight mt-1 italic">
                            Khuyến nghị: {alert.recommendation}
                          </p>
                        )}
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
  );
};

export default FamilyOverview;
