import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { getStaffList, type StaffResponse } from "@/apis/staff.api";
import { toast } from "react-toastify";
import path from "@/constants/path";
import {
  Eye,
  Loader2,
  Plus,
  User,
  Briefcase,
  Clock,
  CheckCircle2,
  ClipboardList,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { AssignTaskDialog } from "@/components/staff/assign-task-dialog";
import { Badge } from "@/components/ui";

const getInitials = (name: string) => {
  if (!name) return "ST";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StaffList(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await getStaffList();
      const staffList = response.data || [];
      setData(staffList);
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      toast.error(error.response?.data?.message || "Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Refresh khi quay lại từ staff-onboard
  useEffect(() => {
    if (location.state?.refreshStaffList) {
      fetchStaff();
      // Clear state để không refresh lại lần sau
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const onClickView = (staff: StaffResponse) => {
    navigate(`${path.staffDetail.replace(":staff_id", staff.user_id)}`);
  };

  const handleAssignTask = (staffId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn click vào row
    setSelectedStaffId(staffId);
    setAssignTaskDialogOpen(true);
  };

  const handleTaskAssigned = () => {
    const fetchStaff = async () => {
      try {
        const response = await getStaffList();
        const staffList = response.data || [];
        setData(staffList);
      } catch (error: any) {
        console.error("Error fetching staff:", error);
      }
    };
    fetchStaff();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">
            Đang tải dữ liệu nhân viên...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Quản lý Nhân viên
            </h1>
            <p className="mt-1 text-slate-500">
              Tổng quan về tất cả nhân viên viện dưỡng lão và phân công của họ.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" /> Thêm thao tác
            </Button>
            {/* Nếu có nút Add Staff thì đặt ở đây */}
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="w-[280px] pl-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nhân viên
                </TableHead>
                <TableHead className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vai trò & Ca làm việc
                </TableHead>
                <TableHead className="text-center py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Đang chờ
                </TableHead>
                <TableHead className="text-center py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hoàn thành hôm nay
                </TableHead>
                <TableHead className="text-center py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cư dân
                </TableHead>
                <TableHead className="text-center py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </TableHead>
                <TableHead className="text-right pr-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <User className="h-8 w-8 opacity-20" />
                      <p>Không tìm thấy nhân viên nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((staff) => (
                  <TableRow
                    key={staff.user_id}
                    className="group hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                    onClick={() => onClickView(staff)}
                  >
                    {/* Name Column */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* Custom Avatar Logic using standard HTML/Tailwind if shadcn Avatar not available */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200 shadow-sm">
                          {getInitials(staff.full_name || staff.email)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {staff.full_name || "Tên không xác định"}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[150px]">
                            {staff.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role & Shift Column */}
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col gap-2 items-start">
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal px-2.5"
                        >
                          <Briefcase className="w-3 h-3 mr-1.5 text-slate-500" />
                          {staff.staff_role || "Nhân viên"}
                        </Badge>
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1.5" />
                          {staff.shift || "Chưa có ca"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Current Tasks */}
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex flex-col items-center justify-center bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100 min-w-[60px]">
                        <ClipboardList className="w-4 h-4 mb-0.5 opacity-70" />
                        <span className="font-bold text-sm">
                          {staff.current_tasks ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Completed Today */}
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 min-w-[60px]">
                        <CheckCircle2 className="w-4 h-4 mb-0.5 opacity-70" />
                        <span className="font-bold text-sm">
                          {staff.completed_tasks_today ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Residents */}
                    <TableCell className="py-4 text-center">
                      <div className="inline-flex flex-col items-center justify-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-100 min-w-[60px]">
                        <Users className="w-4 h-4 mb-0.5 opacity-70" />
                        <span className="font-bold text-sm">
                          {staff.assigned_residents ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 text-center">
                      <Badge
                        variant={
                          staff.status === "active" ? "default" : "secondary"
                        }
                        className={
                          staff.status === "active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                        }
                      >
                        {staff.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="pr-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClickView(staff);
                          }}
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={(e) => handleAssignTask(staff.user_id, e)}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 h-8 px-3 text-xs font-medium rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Phân công
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Assign Task Dialog */}
        {selectedStaffId && (
          <AssignTaskDialog
            open={assignTaskDialogOpen}
            onOpenChange={setAssignTaskDialogOpen}
            staffId={selectedStaffId}
            onSuccess={handleTaskAssigned}
          />
        )}
      </div>
    </div>
  );
}
