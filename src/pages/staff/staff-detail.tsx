import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStaffById,
  getStaffResidents,
  getStaffTasks,
  markTaskDone,
  type StaffDetailResponse,
  type StaffResidentResponse,
  type StaffTaskResponse,
} from "@/apis/staff.api";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui";
import { ArrowLeft, User, Users, CheckCircle2, Loader2 } from "lucide-react";
import path from "@/constants/path";

type TabType = "profile" | "residents" | "tasks";

export default function StaffDetail(): React.JSX.Element {
  const { staff_id } = useParams<{ staff_id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [staff, setStaff] = useState<StaffDetailResponse | null>(null);
  const [residents, setResidents] = useState<StaffResidentResponse[]>([]);
  const [tasks, setTasks] = useState<StaffTaskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState<string | null>(null);

  useEffect(() => {
    if (!staff_id) {
      toast.error("Staff ID không hợp lệ");
      navigate(path.staffList);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const staffResponse = await getStaffById(staff_id);
        setStaff(staffResponse.data);
      } catch (error: any) {
        console.error("Error fetching staff detail:", error);
        toast.error(
          error.response?.data?.message || "Không thể tải thông tin staff"
        );
        navigate(path.staffList);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [staff_id, navigate]);

  useEffect(() => {
    if (!staff_id || activeTab !== "residents") return;

    const fetchResidents = async () => {
      try {
        const response = await getStaffResidents(staff_id);
        setResidents(response.data || []);
      } catch (error: any) {
        console.error("Error fetching residents:", error);
        toast.error("Không thể tải danh sách residents");
      }
    };

    fetchResidents();
  }, [staff_id, activeTab]);

  useEffect(() => {
    if (!staff_id || activeTab !== "tasks") return;

    const fetchTasks = async () => {
      try {
        const response = await getStaffTasks(staff_id);
        setTasks(response.data || null);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
        toast.error("Không thể tải danh sách tasks");
      }
    };

    fetchTasks();
  }, [staff_id, activeTab]);

  const handleMarkDone = async (task_id: string) => {
    try {
      setMarkingDone(task_id);
      await markTaskDone(task_id);
      toast.success("Task đã được đánh dấu hoàn thành");
      // Refresh tasks
      if (staff_id) {
        const response = await getStaffTasks(staff_id);
        setTasks(response.data || null);
      }
    } catch (error: any) {
      console.error("Error marking task done:", error);
      toast.error(
        error.response?.data?.message || "Không thể đánh dấu task hoàn thành"
      );
    } finally {
      setMarkingDone(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "S";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5985d8]" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Không tìm thấy thông tin staff</p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(path.staffList)}
            className="border-gray-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Chi tiết Nhân viên
            </h1>
            <p className="mt-1 text-sm text-gray-600">{staff.full_name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-[#5985d8] text-[#5985d8]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="inline mr-2 h-4 w-4" />
              Hồ sơ
            </button>
            <button
              onClick={() => setActiveTab("residents")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "residents"
                  ? "border-[#5985d8] text-[#5985d8]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="inline mr-2 h-4 w-4" />
              Cư dân được phân công
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tasks"
                  ? "border-[#5985d8] text-[#5985d8]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CheckCircle2 className="inline mr-2 h-4 w-4" />
              Nhiệm vụ
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Nhân viên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
                  <Avatar className="h-24 w-24 border-2 border-gray-200">
                    <AvatarImage
                      src={staff.avatar || undefined}
                      alt={staff.full_name}
                    />
                    <AvatarFallback className="bg-[#5985d8] text-white text-2xl font-semibold">
                      {getInitials(staff.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {staff.full_name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {staff.staff_role || "Nhân viên"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{staff.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                    <p className="text-sm text-gray-900">
                      {staff.phone_number || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Vị trí
                    </p>
                    <p className="text-sm text-gray-900">
                      {staff.staff_role || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Ngày tuyển dụng
                    </p>
                    <p className="text-sm text-gray-900">
                      {staff.hire_date ? formatDate(staff.hire_date) : "-"}
                    </p>
                  </div>
                  {staff.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500">Ghi chú</p>
                      <p className="text-sm text-gray-900">{staff.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "residents" && (
            <Card>
              <CardHeader>
                <CardTitle>Cư dân được phân công</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Họ và tên</TableHead>
                      <TableHead>Giới tính</TableHead>
                      <TableHead>Phòng</TableHead>
                      <TableHead>Ngày nhập viện</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-gray-500"
                        >
                          Chưa có cư dân nào được phân công
                        </TableCell>
                      </TableRow>
                    ) : (
                      residents.map((resident) => (
                        <TableRow key={resident.resident_id}>
                          <TableCell className="font-medium">
                            {resident.full_name}
                          </TableCell>
                          <TableCell>{resident.gender}</TableCell>
                          <TableCell>
                            {resident.room?.room_number || "-"}
                          </TableCell>
                          <TableCell>
                            {resident.admission_date
                              ? formatDate(resident.admission_date)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {activeTab === "tasks" && tasks && (
            <div className="space-y-6">
              {/* Pending Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Nhiệm vụ đang chờ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Cư dân</TableHead>
                        <TableHead>Thời hạn</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.pending_tasks.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-gray-500"
                          >
                            Không có nhiệm vụ đang chờ
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.pending_tasks.map((task) => (
                          <TableRow key={task.care_log_id}>
                            <TableCell className="font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell>{task.type}</TableCell>
                            <TableCell>
                              {task.resident?.full_name || "-"}
                            </TableCell>
                            <TableCell>
                              {formatDateTime(task.start_time)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleMarkDone(task.care_log_id)}
                                disabled={markingDone === task.care_log_id}
                                className="bg-[#5985d8] text-white hover:bg-[#4a74c2]"
                              >
                                {markingDone === task.care_log_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Đánh dấu hoàn thành"
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Completed Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Nhiệm vụ đã hoàn thành</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Cư dân</TableHead>
                        <TableHead>Hoàn thành lúc</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.completed_tasks.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            Không có nhiệm vụ đã hoàn thành
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.completed_tasks.map((task) => (
                          <TableRow key={task.care_log_id}>
                            <TableCell className="font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell>{task.type}</TableCell>
                            <TableCell>
                              {task.resident?.full_name || "-"}
                            </TableCell>
                            <TableCell>
                              {task.end_time
                                ? formatDateTime(task.end_time)
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
