import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
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
  DialogFooter,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  MessageSquare,
  User,
  Calendar,
  Search,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  getCategories,
  getFeedbackStats,
  sendNotification,
  type FeedbackResponse,
  type CategoryResponse,
  type FeedbackStatus,
  type UpdateFeedbackData,
  type CreateNotificationData,
} from "@/apis/feedback.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { getStaffList, type StaffResponse } from "@/apis/staff.api";

const mapStatusToFrontend = (status: FeedbackStatus): string => {
  const mapping: Record<FeedbackStatus, string> = {
    pending: "Đang chờ",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
  };
  return mapping[status] || status;
};

const getStatusColor = (status: FeedbackStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "in_progress":
      return "bg-blue-500";
    case "resolved":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const StaffFeedbackManagement: React.FC = () => {
  // ========== STATE MANAGEMENT ==========
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResident, setFilterResident] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Dialogs
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] =
    useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<FeedbackResponse | null>(null);

  // Update form
  const [updateStatus, setUpdateStatus] = useState<FeedbackStatus>("pending");
  const [updateStaffNotes, setUpdateStaffNotes] = useState<string>("");
  const [updateAssignedStaff, setUpdateAssignedStaff] = useState<string>("");

  // Notification form
  const [notificationTitle, setNotificationTitle] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationRecipient, setNotificationRecipient] = useState<
    "family" | "resident" | "staff"
  >("family");

  // ========== DATA FETCHING ==========
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [
    page,
    filterCategory,
    filterType,
    filterStatus,
    filterResident,
    startDate,
    endDate,
  ]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchResidents(),
        fetchStaffList(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchResidents = async () => {
    try {
      const { residents } = await getResidents();
      setResidents(residents);
    } catch (error: any) {
      console.error("Failed to fetch residents:", error);
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await getStaffList();
      setStaffList(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch staff:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getFeedbackStats();
      setStats(response.data);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const query: any = {
        page,
        limit,
      };

      if (filterCategory !== "all") {
        query.category_id = filterCategory;
      }
      if (filterType !== "all") {
        query.type = filterType;
      }
      if (filterStatus !== "all") {
        query.status = filterStatus;
      }
      if (filterResident !== "all") {
        query.resident_id = filterResident;
      }
      if (startDate) {
        query.start_date = startDate;
      }
      if (endDate) {
        query.end_date = endDate;
      }

      const response = await getFeedbacks(query);
      setFeedbacks(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error("Failed to fetch feedbacks:", error);
      toast.error("Không thể tải danh sách feedback. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // ========== FILTERED DATA ==========
  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbacks;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.message.toLowerCase().includes(query) ||
          f.category?.name.toLowerCase().includes(query) ||
          f.resident?.full_name.toLowerCase().includes(query) ||
          f.type?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [feedbacks, searchQuery]);

  // Get types for selected category
  const selectedCategoryData = categories.find(
    (cat) => cat.category_id === filterCategory
  );
  const availableTypes = selectedCategoryData?.metadata?.types || [];

  // ========== HANDLERS ==========
  const toggleRowExpansion = (feedbackId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(feedbackId)) {
      newExpanded.delete(feedbackId);
    } else {
      newExpanded.add(feedbackId);
    }
    setExpandedRows(newExpanded);
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;

    try {
      const normalizedAssignedStaffId =
        !updateAssignedStaff || updateAssignedStaff === "none"
          ? undefined
          : updateAssignedStaff;

      const updateData: UpdateFeedbackData = {
        status: updateStatus,
        staff_notes: updateStaffNotes || undefined,
        assigned_staff_id: normalizedAssignedStaffId,
      };

      await updateFeedback(selectedFeedback.feedback_id, updateData);
      toast.success("Cập nhật feedback thành công!");
      setIsUpdateDialogOpen(false);
      await fetchFeedbacks();
      await fetchStats();
    } catch (error: any) {
      console.error("Failed to update feedback:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể cập nhật feedback. Vui lòng thử lại sau."
      );
    }
  };

  const handleSendNotification = async () => {
    if (!selectedFeedback) return;

    try {
      const notificationData: CreateNotificationData = {
        feedback_id: selectedFeedback.feedback_id,
        recipient_type: notificationRecipient,
        message: notificationMessage,
        title: notificationTitle,
      };

      await sendNotification(notificationData);
      toast.success("Gửi thông báo thành công!");
      setIsNotificationDialogOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể gửi thông báo. Vui lòng thử lại sau."
      );
    }
  };

  const openUpdateDialog = (feedback: FeedbackResponse) => {
    setSelectedFeedback(feedback);
    setUpdateStatus(feedback.status);
    setUpdateStaffNotes(feedback.staff_notes || "");
    setUpdateAssignedStaff(feedback.assigned_staff_id || "none");
    setIsUpdateDialogOpen(true);
  };

  const openNotificationDialog = (feedback: FeedbackResponse) => {
    setSelectedFeedback(feedback);
    setNotificationTitle(
      `Cập nhật về feedback: ${feedback.category?.name || "N/A"}`
    );
    setNotificationMessage(
      `Feedback của bạn về "${
        feedback.category?.name || "N/A"
      }" đã được cập nhật.`
    );
    setIsNotificationDialogOpen(true);
  };

  // ========== RENDER ==========
  if (loading && feedbacks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#5985D8" }}>
        Quản lý Feedback
      </h1>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border rounded-xl p-4">
            <CardContent className="p-0">
              <div className="text-sm text-gray-600">Tổng số</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border rounded-xl p-4">
            <CardContent className="p-0">
              <div className="text-sm text-gray-600">Đang chờ</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus?.pending || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border rounded-xl p-4">
            <CardContent className="p-0">
              <div className="text-sm text-gray-600">Đang xử lý</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus?.in_progress || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border rounded-xl p-4">
            <CardContent className="p-0">
              <div className="text-sm text-gray-600">Đã giải quyết</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.resolved || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 bg-white shadow-sm border rounded-xl p-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Danh mục</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    Tất cả
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.category_id}
                      value={cat.category_id}
                      className="cursor-pointer"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableTypes.length > 0 && (
              <div>
                <Label>Loại</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">
                      Tất cả
                    </SelectItem>
                    {availableTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="cursor-pointer"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Trạng thái</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    Tất cả
                  </SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">
                    Đang chờ
                  </SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">
                    Đang xử lý
                  </SelectItem>
                  <SelectItem value="resolved" className="cursor-pointer">
                    Đã giải quyết
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cư dân</Label>
              <Select value={filterResident} onValueChange={setFilterResident}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    Tất cả
                  </SelectItem>
                  {residents.map((resident) => (
                    <SelectItem
                      key={resident.resident_id}
                      value={resident.resident_id}
                      className="cursor-pointer"
                    >
                      {resident.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Từ ngày</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Đến ngày</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo nội dung, danh mục, cư dân..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card className="bg-white shadow-sm border rounded-xl">
        <CardHeader>
          <CardTitle>Danh sách Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Cư dân</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Không có feedback nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedbacks.map((feedback) => {
                    const isExpanded = expandedRows.has(feedback.feedback_id);
                    return (
                      <React.Fragment key={feedback.feedback_id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50 transition-all duration-150"
                          onClick={() =>
                            toggleRowExpansion(feedback.feedback_id)
                          }
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell>
                            {feedback.resident?.full_name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {feedback.resident?.room?.room_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            {feedback.category?.name || "N/A"}
                          </TableCell>
                          <TableCell>{feedback.type || "N/A"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {feedback.message.substring(0, 50)}
                            {feedback.message.length > 50 ? "..." : ""}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(feedback.status)}>
                              {mapStatusToFrontend(feedback.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {feedback.assigned_staff?.staffProfile?.full_name ||
                              feedback.assigned_staff?.user_id ||
                              "Chưa phân công"}
                          </TableCell>
                          <TableCell>
                            {new Date(feedback.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(feedback)}
                                className="cursor-pointer"
                              >
                                Cập nhật
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNotificationDialog(feedback)}
                                className="cursor-pointer"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={10} className="bg-gray-50">
                              <div className="p-4 space-y-4">
                                <div>
                                  <strong>Nội dung đầy đủ:</strong>
                                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                                    {feedback.message}
                                  </p>
                                </div>
                                {feedback.staff_notes && (
                                  <div>
                                    <strong>Ghi chú nhân viên:</strong>
                                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                                      {feedback.staff_notes}
                                    </p>
                                  </div>
                                )}
                                {feedback.attachments &&
                                  feedback.attachments.length > 0 && (
                                    <div>
                                      <strong>File đính kèm:</strong>
                                      <div className="mt-2 space-y-2">
                                        {feedback.attachments.map(
                                          (url, idx) => (
                                            <a
                                              key={idx}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline block"
                                            >
                                              File {idx + 1}
                                            </a>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                {feedback.resident?.dietTags &&
                                  feedback.resident.dietTags.length > 0 && (
                                    <div>
                                      <strong>Diet Tags:</strong>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        {feedback.resident.dietTags.map(
                                          (tag) => (
                                            <Badge
                                              key={tag.tag_id}
                                              variant="outline"
                                            >
                                              {tag.tag_name}
                                            </Badge>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <strong>Người gửi:</strong>{" "}
                                    {feedback.family_user?.familyProfile
                                      ?.full_name || "N/A"}
                                  </div>
                                  <div>
                                    <strong>Email:</strong>{" "}
                                    {feedback.family_user?.email || "N/A"}
                                  </div>
                                  {feedback.resolved_at && (
                                    <div>
                                      <strong>Ngày giải quyết:</strong>{" "}
                                      {new Date(
                                        feedback.resolved_at
                                      ).toLocaleString("vi-VN")}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Hiển thị {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} trong tổng số {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="cursor-pointer"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="cursor-pointer"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Feedback Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật Feedback</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <Label>Trạng thái *</Label>
                <Select
                  value={updateStatus}
                  onValueChange={(v) => setUpdateStatus(v as FeedbackStatus)}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className="cursor-pointer">
                      Đang chờ
                    </SelectItem>
                    <SelectItem value="in_progress" className="cursor-pointer">
                      Đang xử lý
                    </SelectItem>
                    <SelectItem value="resolved" className="cursor-pointer">
                      Đã giải quyết
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ghi chú nội bộ</Label>
                <Textarea
                  value={updateStaffNotes}
                  onChange={(e) => setUpdateStaffNotes(e.target.value)}
                  placeholder="Ghi chú nội bộ cho nhân viên..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Phân công nhân viên</Label>
                <Select
                  value={updateAssignedStaff || "none"}
                  onValueChange={(v) =>
                    setUpdateAssignedStaff(v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Chọn nhân viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="cursor-pointer">
                      Không phân công
                    </SelectItem>
                    {staffList.map((staff) => (
                      <SelectItem
                        key={staff.user_id}
                        value={staff.user_id}
                        className="cursor-pointer"
                      >
                        {staff.full_name || staff.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateFeedback}
              style={{ backgroundColor: "#5985D8" }}
              className="cursor-pointer"
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi Thông báo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Người nhận</Label>
              <Select
                value={notificationRecipient}
                onValueChange={(v: any) => setNotificationRecipient(v)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family" className="cursor-pointer">
                    Gia đình
                  </SelectItem>
                  <SelectItem value="resident" className="cursor-pointer">
                    Tất cả thành viên gia đình của cư dân
                  </SelectItem>
                  <SelectItem value="staff" className="cursor-pointer">
                    Nhân viên
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tiêu đề *</Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Tiêu đề thông báo"
              />
            </div>

            <div>
              <Label>Nội dung *</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Nội dung thông báo"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNotificationDialogOpen(false)}
              className="cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendNotification}
              style={{ backgroundColor: "#5985D8" }}
              className="cursor-pointer"
              disabled={!notificationTitle || !notificationMessage}
            >
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffFeedbackManagement;
