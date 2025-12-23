import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Search, Plus, Edit, Trash2, UserCog } from "lucide-react";
import { toast } from "react-toastify";
import {
  getAdminStaff,
  createAdmin,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminMe,
  exportAdminStaff,
  approveAdminStaff,
  rejectAdminStaff,
  resetAdminStaffPassword,
  assignAdminStaffResident,
  unassignAdminStaffResident,
  getAdminStaffAudit,
} from "@/apis/admin.api";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";

import { usePaginationQuerySync } from "@/hooks/use-pagination-query";

const RANGE = 2;
type PaginationItem = number | "ellipsis";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const candidates = new Set<number>();
  for (let i = currentPage - RANGE; i <= currentPage + RANGE; i += 1) {
    if (i >= 1 && i <= totalPages) {
      candidates.add(i);
    }
  }
  candidates.add(1);
  if (totalPages >= 2) {
    candidates.add(2);
    candidates.add(totalPages);
    if (totalPages - 1 > 0) {
      candidates.add(totalPages - 1);
    }
  }

  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const result: PaginationItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (page - prev > 1) {
        result.push("ellipsis");
      }
    }
    result.push(page);
  });
  return result;
};

const AdminStaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const { page, limit, setPage } = usePaginationQuerySync(10);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });
  const [editFormData, setEditFormData] = useState({
    role: "Staff" as "Staff" | "Admin",
    status: "active" as "active" | "inactive" | "pending",
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page,
    limit,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    checkRole();
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, roleFilter, statusFilter]);

  const checkRole = async () => {
    try {
      const response = await getAdminMe();
      if (response.data.role === "RootAdmin") {
        setIsRootAdmin(true);
      }
    } catch (error) {
      // Ignore
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAdminStaff({
        page,
        limit,
        search: search || undefined,
        role:
          roleFilter === "all"
            ? undefined
            : (roleFilter as "Staff" | "Admin" | "RootAdmin"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "active" | "inactive" | "pending"),
      });
      setStaff(response.staff || []);

      const fallbackTotal = Math.max(
        (page - 1) * limit + (response.staff?.length || 0),
        response.staff?.length || 0
      );
      const fallbackMeta = {
        page,
        limit,
        total: fallbackTotal,
        totalPages: Math.max(1, Math.ceil(fallbackTotal / limit)),
      };
      setPagination(response.pagination || fallbackMeta);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const paginationItems = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    return buildPaginationItems(page, totalPages);
  }, [page, pagination.totalPages]);

  const totalStaff = pagination.total ?? staff.length;
  const showingFrom = totalStaff === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo =
    totalStaff === 0
      ? 0
      : Math.min(totalStaff, showingFrom + staff.length - 1);
  const canGoPrev = page > 1;
  const canGoNext = page < pagination.totalPages;

  const handleCreate = () => {
    if (!isRootAdmin) {
      toast.error("Chỉ RootAdmin mới có thể tạo Admin");
      return;
    }
    setFormData({ email: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setEditFormData({
      role:
        staffMember.role === "RootAdmin"
          ? "Admin"
          : (staffMember.role as "Staff" | "Admin"),
      status: staffMember.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.email) {
      toast.error("Vui lòng nhập email");
      return;
    }

    try {
      await createAdmin({ email: formData.email, institution_id: "" });
      toast.success("Đã gửi lời mời Admin");
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tạo Admin");
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingStaff) return;

    try {
      await updateAdminStaff(editingStaff.user_id, editFormData);
      toast.success("Cập nhật thành công");
      setIsEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể cập nhật");
    }
  };

  const handleQuickUpdate = async (id: string, data: any) => {
    try {
      await updateAdminStaff(id, data);
      toast.success("Đã cập nhật");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveAdminStaff(id);
      toast.success("Đã phê duyệt");
      loadData();
    } catch (error: any) {
      toast.error("Phê duyệt thất bại");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAdminStaff(id, { approve: false });
      toast.success("Đã từ chối");
      loadData();
    } catch (error: any) {
      toast.error("Từ chối thất bại");
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await resetAdminStaffPassword(id);
      toast.success("Đã gửi email đặt lại mật khẩu");
    } catch (error: any) {
      toast.error("Đặt lại thất bại");
    }
  };

  const handleAssign = async (id: string) => {
    const resident_id = window.prompt("Nhập ID cư dân để gán");
    if (!resident_id) return;
    try {
      await assignAdminStaffResident(id, { resident_id });
      toast.success("Đã gán");
    } catch (error: any) {
      toast.error("Gán thất bại");
    }
  };

  const handleUnassign = async (id: string) => {
    const resident_id = window.prompt("Nhập ID cư dân để hủy gán");
    if (!resident_id) return;
    try {
      await unassignAdminStaffResident(id, resident_id);
      toast.success("Đã hủy gán");
    } catch (error: any) {
      toast.error("Hủy gán thất bại");
    }
  };

  const handleAudit = async (id: string) => {
    try {
      const res = await getAdminStaffAudit(id);
      setAuditLogs(res.data || []);
      setShowAudit(true);
    } catch (error: any) {
      toast.error("Tải nhật ký kiểm toán thất bại");
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const blob = await exportAdminStaff({
        search: search || undefined,
        role:
          roleFilter === "all"
            ? undefined
            : (roleFilter as "Staff" | "Admin" | "RootAdmin"),
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "active" | "inactive" | "pending"),
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `staff.${format === "xlsx" ? "xlsx" : "csv"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      toast.error("Xuất dữ liệu thất bại");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!isRootAdmin) {
      toast.error("Chỉ RootAdmin mới có thể xóa nhân viên");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này không?"))
      return;

    try {
      await deleteAdminStaff(userId);
      toast.success("Đã xóa nhân viên");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa nhân viên");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "RootAdmin":
        return <Badge className="bg-purple-500 text-white">Root Admin</Badge>;
      case "Admin":
        return <Badge className="bg-blue-500 text-white">Admin</Badge>;
      case "Staff":
        return <Badge className="bg-green-500 text-white">Staff</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-green-500 text-white">Hoạt động</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">Ngừng hoạt động</Badge>
    );
  };

  if (loading && staff.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-white border-gray-300 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-t-md">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Quản trị viên & Nhân viên
            </CardTitle>
            {isRootAdmin && (
              <Button
                onClick={handleCreate}
                className="bg-[#4f7df5] hover:bg-[#3c6be6] text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo Admin
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo email hoặc tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <Label>Vai trò</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Staff">Nhân viên</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="RootAdmin">Root Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  variant="outline"
                  className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                >
                  Xóa bộ lọc
                </Button>
              </div>
              <div className="flex items-end justify-start md:justify-end gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                  onClick={() => handleExport("csv")}
                >
                  Xuất CSV
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={() => handleExport("xlsx")}
                >
                  Xuất XLSX
                </Button>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow key={staffMember.user_id}>
                      <TableCell className="font-medium">
                        {staffMember.email}
                      </TableCell>
                      <TableCell>
                        {staffMember.staffProfile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={staffMember.role}
                          onValueChange={(val) =>
                            handleQuickUpdate(staffMember.user_id, {
                              role: val as any,
                            })
                          }
                          disabled={staffMember.role === "RootAdmin"}
                        >
                          <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff">Nhân viên</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="RootAdmin" disabled>
                              RootAdmin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={staffMember.status}
                          onValueChange={(val) =>
                            handleQuickUpdate(staffMember.user_id, {
                              status: val as any,
                            })
                          }
                        >
                          <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Đang chờ</SelectItem>
                            <SelectItem value="active">Hoạt động</SelectItem>
                            <SelectItem value="inactive">
                              Ngừng hoạt động
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
                            onClick={() =>
                              handleResetPassword(staffMember.user_id)
                            }
                          >
                            Reset mật khẩu
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            onClick={() => handleAudit(staffMember.user_id)}
                          >
                            Kiểm toán
                          </Button> */}
                          {staffMember.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                onClick={() =>
                                  handleApprove(staffMember.user_id)
                                }
                              >
                                Phê duyệt
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleReject(staffMember.user_id)
                                }
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(staffMember)}
                            className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100"
                            onClick={() => handleAssign(staffMember.user_id)}
                          >
                            Gán
                          </Button> */}
                          {/* <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
                            onClick={() => handleUnassign(staffMember.user_id)}
                          >
                            Hủy gán
                          </Button> */}
                          {isRootAdmin && staffMember.role !== "RootAdmin" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(staffMember.user_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
              <p className="text-sm text-gray-600">
                Hiển thị{" "}
                <span className="font-semibold">
                  {totalStaff === 0 ? 0 : showingFrom} - {showingTo}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold">{totalStaff}</span> nhân viên
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => canGoPrev && setPage(page - 1)}
                  disabled={!canGoPrev}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer bg-white"
                >
                  Trước
                </button>
                {paginationItems.map((item, idx) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`px-3 py-1 rounded border text-sm cursor-pointer ${
                        item === page
                          ? "bg-[#5985d8] text-white border-[#5985d8]"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => canGoNext && setPage(page + 1)}
                  disabled={!canGoNext}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer bg-white"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Tạo Admin mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="admin@example.com"
                className="bg-white border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitCreate}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
              >
                Tạo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingStaff && editingStaff.role === "RootAdmin" && (
              <p className="text-sm text-gray-600">
                Không thể thay đổi vai trò của RootAdmin
              </p>
            )}
            <div>
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: "Staff" | "Admin") =>
                  setEditFormData({ ...editFormData, role: value })
                }
                disabled={editingStaff?.role === "RootAdmin"}
              >
                <SelectTrigger className="bg-white border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Nhân viên</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setEditFormData({ ...editFormData, status: value })
                }
              >
                <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitEdit}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaffManagement;
