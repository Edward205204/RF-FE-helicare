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
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  getAdminResidents,
  createAdminResident,
  updateAdminResident,
  deleteAdminResident,
  updateAdminResidentStatus,
  exportAdminResidents,
  getAdminResidentAudit,
  getAdminResidentAssignments,
} from "@/apis/admin.api";
import { getRooms } from "@/apis/room.api";

const AdminResidentsManagement: React.FC = () => {
  const [residents, setResidents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    gender: "male" as "male" | "female",
    date_of_birth: "",
    room_id: "none",
    notes: "",
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAudit, setShowAudit] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, roomFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [residentsRes, roomsRes] = await Promise.all([
        getAdminResidents({
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter as any,
          room_id: roomFilter || undefined,
        }),
        getRooms(),
      ]);
      setResidents(residentsRes.residents || []);
      setRooms(roomsRes.rooms || []);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = useMemo(() => {
    if (!search) return residents;
    return residents.filter((r) =>
      r.full_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [residents, search]);

  const handleCreate = () => {
    setEditingResident(null);
    setFormData({
      full_name: "",
      gender: "male",
      date_of_birth: "",
      room_id: "none",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (resident: any) => {
    setEditingResident(resident);
    setFormData({
      full_name: resident.full_name || "",
      gender: resident.gender || "male",
      date_of_birth: resident.date_of_birth
        ? new Date(resident.date_of_birth).toISOString().split("T")[0]
        : "",
      room_id: resident.room_id || "none",
      notes: resident.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (
    residentId: string,
    status: "active" | "inactive" | "discharged"
  ) => {
    try {
      await updateAdminResidentStatus(residentId, { status });
      toast.success("Đã cập nhật trạng thái");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật trạng thái"
      );
    }
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    try {
      const blob = await exportAdminResidents({
        status: (statusFilter as any) || undefined,
        room_id: roomFilter || undefined,
        search: search || undefined,
        format,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `residents.${format === "xlsx" ? "xlsx" : "csv"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: any) {
      toast.error("Xuất dữ liệu thất bại");
    }
  };

  const handleAudit = async (residentId: string) => {
    try {
      const res = await getAdminResidentAudit(residentId);
      setAuditLogs(res.data || []);
      setShowAudit(true);
    } catch (error: any) {
      toast.error("Không thể tải nhật ký kiểm toán");
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.date_of_birth) {
      toast.error("Vui lòng điền tất cả các trường bắt buộc");
      return;
    }

    const requestData = {
      ...formData,
      room_id: formData.room_id === "none" ? undefined : formData.room_id,
    };

    try {
      if (editingResident) {
        await updateAdminResident(editingResident.resident_id, requestData);
        toast.success("Cập nhật cư dân thành công");
      } else {
        await createAdminResident(requestData);
        toast.success("Tạo cư dân thành công");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể lưu cư dân");
    }
  };

  const handleDelete = async (residentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cư dân này không?")) return;

    try {
      await deleteAdminResident(residentId);
      toast.success("Đã xóa cư dân");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa cư dân");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (resident: any) => {
    const isActive = resident.admission_date !== null;
    return isActive ? (
      <Badge className="bg-green-500 text-white">Hoạt động</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">Chưa tiếp nhận</Badge>
    );
  };

  if (loading && residents.length === 0) {
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
              Thông tin cư dân
            </CardTitle>
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
                    placeholder="Tìm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select
                  // Radix không cho value rỗng, dùng 'all' làm sentinel
                  value={statusFilter || "all"}
                  onValueChange={(val) =>
                    setStatusFilter(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="discharged">Chưa tiếp nhận</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phòng</Label>
                <Select
                  value={roomFilter || "all"}
                  onValueChange={(val) =>
                    setRoomFilter(val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger className="bg-white border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.room_id} value={room.room_id}>
                        {room.room_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setRoomFilter("");
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
                  <TableHead>Tên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResidents.map((resident) => (
                    <TableRow key={resident.resident_id}>
                      <TableCell className="font-medium">
                        {resident.full_name}
                      </TableCell>
                      <TableCell>
                        {resident.gender === "male" ? "Nam" : "Nữ"}
                      </TableCell>
                      <TableCell>
                        {formatDate(resident.date_of_birth)}
                      </TableCell>
                      <TableCell>
                        {resident.room?.room_number || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={resident.status || "active"}
                          onValueChange={async (val) =>
                            handleUpdateStatus(
                              resident.resident_id,
                              val as "active" | "inactive" | "discharged"
                            )
                          }
                        >
                          <SelectTrigger className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Hoạt động</SelectItem>
                            <SelectItem value="inactive">
                              Không hoạt động
                            </SelectItem>
                            <SelectItem value="discharged">
                              Chưa tiếp nhận
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(resident)}
                            className="border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(resident.resident_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                            onClick={() => handleAudit(resident.resident_id)}
                          >
                            Kiểm toán
                          </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>
              {editingResident ? "Chỉnh sửa cư dân" : "Thêm cư dân mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Giới tính</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: "male" | "female") =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">
                  Ngày sinh <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                  className="bg-white border-gray-300"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="room_id">Phòng</Label>
              <Select
                value={formData.room_id || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, room_id: value })
                }
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không chọn</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id}>
                      {room.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Ghi chú</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="bg-white border-gray-300"
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
                onClick={handleSubmit}
                className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
              >
                {editingResident ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit drawer/modal */}
      <Dialog open={showAudit} onOpenChange={setShowAudit}>
        <DialogContent className="max-w-3xl bg-white border-gray-300">
          <DialogHeader>
            <DialogTitle>Nhật ký kiểm toán</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Không có nhật ký</p>
            ) : (
              auditLogs.map((log: any) => (
                <div
                  key={log.audit_id}
                  className="border border-gray-200 rounded p-2 text-sm"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {log.metadata && (
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResidentsManagement;
