import React, { useState, useEffect } from "react";
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
} from "@/apis/admin.api";
import { useNavigate } from "react-router-dom";
import path from "@/constants/path";

const AdminStaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });
  const [editFormData, setEditFormData] = useState({
    role: "Staff" as "Staff" | "Admin",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    checkRole();
    loadData();
  }, []);

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
        search: search || undefined,
        role: roleFilter as any,
      });
      setStaff(response.staff || []);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, roleFilter]);

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
      toast.success("Đã gửi lời mời tạo Admin");
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

  const handleDelete = async (userId: string) => {
    if (!isRootAdmin) {
      toast.error("Chỉ RootAdmin mới có thể xóa nhân viên");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xóa nhân viên này?")) return;

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
      <Badge className="bg-gray-500 text-white">Không hoạt động</Badge>
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
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">
              Quản lý Nhân viên
            </CardTitle>
            {isRootAdmin && (
              <Button
                onClick={handleCreate}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo email hoặc tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-gray-300"
                  />
                </div>
              </div>
              <div>
                <Label>Vai trò</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="RootAdmin">Root Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("");
                  }}
                  variant="outline"
                  className="w-full border-gray-300"
                >
                  Xóa bộ lọc
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
                  <TableHead>Thao tác</TableHead>
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
                      <TableCell>{getRoleBadge(staffMember.role)}</TableCell>
                      <TableCell>
                        {getStatusBadge(staffMember.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(staffMember)}
                            className="border-gray-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300"
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
            <DialogTitle>Sửa Nhân viên</DialogTitle>
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
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
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
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300"
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
