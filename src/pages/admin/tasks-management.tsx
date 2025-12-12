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
import { Textarea } from "@/components/ui";
import { Search, Plus, Edit, Trash2, ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import {
  getAdminTasks,
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
} from "@/apis/admin.api";
import { getAdminStaff } from "@/apis/admin.api";

const AdminTasksManagement: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    staff_id: "",
    resident_id: "",
    due_date: "",
    priority: "medium" as "low" | "medium" | "high",
    status: "pending" as "pending" | "in_progress" | "completed",
  });

  useEffect(() => {
    loadData();
    loadStaff();
  }, []);

  useEffect(() => {
    loadData();
  }, [statusFilter, staffFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAdminTasks({
        status: statusFilter as any,
        staff_id: staffFilter || undefined,
      });
      setTasks(response.tasks || []);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await getAdminStaff({});
      setStaff(response.staff || []);
    } catch (error) {
      // Ignore
    }
  };

  const handleCreate = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      staff_id: "",
      resident_id: "",
      due_date: "",
      priority: "medium",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.notes || "",
      description: task.notes || "",
      staff_id: task.staff_id || "",
      resident_id: task.resident_id || "",
      due_date: task.due_date
        ? new Date(task.due_date).toISOString().split("T")[0]
        : "",
      priority: "medium",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.staff_id) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editingTask) {
        await updateAdminTask(editingTask.care_log_id, {
          description: formData.description,
        });
        toast.success("Cập nhật nhiệm vụ thành công");
        setIsDialogOpen(false);
        loadData();
        return;
      } else {
        await createAdminTask({
          title: formData.title,
          description: formData.description,
          staff_id: formData.staff_id,
          resident_id: formData.resident_id || undefined,
          due_date: formData.due_date || undefined,
          priority: formData.priority,
        });
        toast.success("Tạo nhiệm vụ thành công");
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể lưu nhiệm vụ");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhiệm vụ này?")) return;

    try {
      await deleteAdminTask(taskId);
      toast.success("Đã xóa nhiệm vụ");
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể xóa nhiệm vụ");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">Hoàn thành</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500 text-white">Đang thực hiện</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Đang chờ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading && tasks.length === 0) {
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
              Nhiệm vụ & Báo cáo
            </CardTitle>
            <Button
              onClick={handleCreate}
              className="bg-[#5985d8] hover:bg-[#5183c9] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo Nhiệm vụ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nhân viên</Label>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {staff.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        {s.staffProfile?.full_name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setStatusFilter("");
                    setStaffFilter("");
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
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Hạn chót</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.care_log_id}>
                      <TableCell>{task.notes || "N/A"}</TableCell>
                      <TableCell>
                        {task.staff?.staffProfile?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>{task.resident?.full_name || "N/A"}</TableCell>
                      <TableCell>{formatDate(task.due_date)}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(task)}
                            className="border-gray-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(task.care_log_id)}
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
              {editingTask ? "Sửa Nhiệm vụ" : "Tạo Nhiệm vụ mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-white border-gray-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-white border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staff_id">
                  Nhân viên <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, staff_id: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>
                        {s.staffProfile?.full_name || s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Hạn chót</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                  className="bg-white border-gray-300"
                />
              </div>
            </div>
            {editingTask && (
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={editingTask.status}
                  onValueChange={async (value: any) => {
                    try {
                      await updateAdminTask(editingTask.care_log_id, {
                        status: value,
                      });
                      toast.success("Cập nhật trạng thái thành công");
                      loadData();
                      setIsDialogOpen(false);
                    } catch (error: any) {
                      toast.error(
                        error.response?.data?.message || "Không thể cập nhật"
                      );
                    }
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                {editingTask ? "Cập nhật" : "Tạo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasksManagement;
