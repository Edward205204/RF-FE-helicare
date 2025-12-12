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
      toast.error("Không thể tải danh sách phản hồi. Vui lòng thử lại sau.");
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
      toast.success("Cập nhật phản hồi thành công!");
      setIsUpdateDialogOpen(false);
      await fetchFeedbacks();
      await fetchStats();
    } catch (error: any) {
      console.error("Failed to update feedback:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể cập nhật phản hồi. Vui lòng thử lại sau."
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
      `Cập nhật về phản hồi: ${feedback.category?.name || "N/A"}`
    );
    setNotificationMessage(
      `Phản hồi của bạn về "${
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
        Quản lý phản hồi
      </h1>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white shadow-sm border rounded-xl p-4">
            <CardContent className="p-0">
              <div className="text-sm text-gray-600">Tổng cộng</div>
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
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All
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
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All
                  </SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">
                    Pending
                  </SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">
                    In Progress
                  </SelectItem>
                  <SelectItem value="resolved" className="cursor-pointer">
                    Resolved
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cư dân</Label>
              <Select value={filterResident} onValueChange={setFilterResident}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    All
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
      <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden ring-1 ring-gray-200">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">
              Danh sách phản hồi
            </CardTitle>
            {/* Có thể thêm badge tổng số lượng ở đây nếu muốn */}
            <div className="text-sm text-gray-500 font-medium">
              Tổng: {total} bản ghi
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100/80 hover:bg-gray-100/80 border-b border-gray-200">
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Cư dân
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 w-20">
                    Phòng
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Danh mục
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Loại
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 w-64">
                    Nội dung
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Nhân viên
                  </TableHead>
                  <TableHead className="font-bold text-gray-700">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="font-bold text-gray-700 text-center w-32">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-lg">📭</span>
                        <span>Không tìm thấy phản hồi nào.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedbacks.map((feedback) => {
                    const isExpanded = expandedRows.has(feedback.feedback_id);
                    return (
                      <React.Fragment key={feedback.feedback_id}>
                        <TableRow
                          className={`cursor-pointer transition-all duration-200 border-b border-gray-100 group
                      ${
                        isExpanded
                          ? "bg-blue-50/60 border-blue-100"
                          : "hover:bg-blue-50/30"
                      }
                    `}
                          onClick={() =>
                            toggleRowExpansion(feedback.feedback_id)
                          }
                        >
                          <TableCell className="text-center">
                            <div
                              className={`p-1 rounded-full transition-colors ${
                                isExpanded
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-gray-400 group-hover:text-gray-600"
                              }`}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-gray-800 py-4">
                            {feedback.resident?.full_name || "N/A"}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                              {feedback.resident?.room?.room_number || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">
                            {feedback.category?.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">
                            {feedback.type || "N/A"}
                          </TableCell>
                          <TableCell className="max-w-xs py-4">
                            <p
                              className="truncate text-gray-600"
                              title={feedback.message}
                            >
                              {feedback.message}
                            </p>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`${getStatusColor(
                                feedback.status
                              )} px-3 py-1 shadow-sm font-normal`}
                            >
                              {mapStatusToFrontend(feedback.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 py-4">
                            {feedback.assigned_staff?.staffProfile?.full_name ||
                              feedback.assigned_staff?.user_id || (
                                <span className="text-gray-400 italic">
                                  Chưa phân công
                                </span>
                              )}
                          </TableCell>
                          <TableCell className="text-gray-600 py-4 text-sm whitespace-nowrap">
                            {new Date(feedback.created_at).toLocaleDateString(
                              "en-US"
                            )}
                          </TableCell>
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            className="py-4"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openUpdateDialog(feedback)}
                                className="h-8 px-3 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                Cập nhật
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openNotificationDialog(feedback)}
                                className="h-8 w-8 p-0 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Send thông báo"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <TableRow className="bg-blue-50/30 hover:bg-blue-50/30">
                            <TableCell
                              colSpan={10}
                              className="p-0 border-b border-blue-100"
                            >
                              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                                {/* Cột 1: Content chính */}
                                <div className="md:col-span-2 space-y-4">
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      📝 Nội dung chi tiết
                                    </h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                      {feedback.message}
                                    </p>
                                  </div>

                                  {feedback.staff_notes && (
                                    <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
                                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                                        📌 Ghi chú của nhân viên
                                      </h4>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {feedback.staff_notes}
                                      </p>
                                    </div>
                                  )}

                                  {feedback.attachments &&
                                    feedback.attachments.length > 0 && (
                                      <div className="mt-2">
                                        <strong className="text-sm text-gray-700">
                                          📎 Tệp đính kèm:
                                        </strong>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {feedback.attachments.map(
                                            (url, idx) => (
                                              <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-blue-600 hover:bg-blue-100 transition-colors border border-gray-200"
                                              >
                                                File {idx + 1} ↗
                                              </a>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </div>

                                {/* Cột 2: Thông tin phụ */}
                                <div className="space-y-4 text-sm">
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                                    <h4 className="font-semibold text-gray-900 border-b pb-2">
                                      Thông tin người gửi
                                    </h4>
                                    <div className="grid grid-cols-1 gap-y-2">
                                      <div>
                                        <span className="text-gray-500 block text-xs">
                                          Người gửi:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                          {feedback.family_user?.familyProfile
                                            ?.full_name || "N/A"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block text-xs">
                                          Email:
                                        </span>
                                        <span className="font-medium text-gray-800">
                                          {feedback.family_user?.email || "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                                    <h4 className="font-semibold text-gray-900 border-b pb-2">
                                      Thông tin xử lý
                                    </h4>
                                    <div>
                                      <span className="text-gray-500 block text-xs">
                                        Ngày giải quyết:
                                      </span>
                                      <span className="font-medium text-gray-800">
                                        {feedback.resolved_at
                                          ? new Date(
                                              feedback.resolved_at
                                            ).toLocaleString("en-US")
                                          : "Chưa giải quyết"}
                                      </span>
                                    </div>
                                    {feedback.resident?.dietTags &&
                                      feedback.resident.dietTags.length > 0 && (
                                        <div>
                                          <span className="text-gray-500 block text-xs mb-1">
                                            Diet Tags:
                                          </span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {feedback.resident.dietTags.map(
                                              (tag) => (
                                                <Badge
                                                  key={tag.tag_id}
                                                  variant="outline"
                                                  className="text-xs bg-red-50 text-red-600 border-red-100"
                                                >
                                                  {tag.tag_name}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
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

          {/* Footer / Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
              <div className="text-sm text-gray-600 font-medium">
                Hiển thị {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)}{" "}
                <span className="text-gray-400 mx-1">/</span> {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="cursor-pointer hover:bg-white bg-white shadow-sm"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="cursor-pointer hover:bg-white bg-white shadow-sm"
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
            <DialogTitle>Cập nhật phản hồi</DialogTitle>
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
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFeedback}
              style={{ backgroundColor: "#5985D8" }}
              className="cursor-pointer"
            >
              Update
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
            <DialogTitle>Gửi thông báo</DialogTitle>
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
                    Staff
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
              Cancel
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
