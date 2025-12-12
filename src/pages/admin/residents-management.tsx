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
    room_id: "",
    notes: "",
  });

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
      room_id: "",
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
      room_id: resident.room_id || "",
      notes: resident.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.date_of_birth) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editingResident) {
        await updateAdminResident(editingResident.resident_id, formData);
        toast.success("Cập nhật cư dân thành công");
      } else {
        await createAdminResident(formData);
        toast.success("Tạo cư dân thành công");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể lưu cư dân");
    }
  };

  const handleDelete = async (residentId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa cư dân này?")) return;

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
      <Badge className="bg-green-500 text-white">Đang ở</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white">Chưa nhập viện</Badge>
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
            <CardTitle className="text-2xl font-bold">Quản lý Cư dân</CardTitle>
            <Button
              onClick={handleCreate}
              className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Cư dân
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm theo tên..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-gray-300"
                  />
                </div>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value="active">Đang ở</SelectItem>
                    <SelectItem value="discharged">Chưa nhập viện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phòng</Label>
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
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
                  <TableHead>Tên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Ngày sinh</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
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
                      <TableCell>{getStatusBadge(resident)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(resident)}
                            className="border-gray-300"
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
              {editingResident ? "Sửa Cư dân" : "Thêm Cư dân mới"}
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
                value={formData.room_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, room_id: value })
                }
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không chọn</SelectItem>
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
                {editingResident ? "Cập nhật" : "Tạo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminResidentsManagement;
