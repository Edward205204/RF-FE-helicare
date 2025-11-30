import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import { Separator } from "@/components/ui";
import { toast } from "react-toastify";
import {
  createFeedback,
  getFeedbacksByFamily,
  getFeedbackById,
  getCategories,
  type FeedbackResponse,
  type CategoryResponse,
  type FeedbackStatus,
} from "@/apis/feedback.api";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import { Loader2 } from "lucide-react";
import path from "@/constants/path";

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

const extractApiData = <T,>(payload: unknown): T | null => {
  if (!payload) return null;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in (payload as Record<string, unknown>)
  ) {
    const nested = (payload as Record<string, unknown>).data;
    return (nested as T) ?? null;
  }
  return payload as T;
};

const FamilyFeedbackSupport: React.FC = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<FeedbackResponse[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<FeedbackResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories and residents on mount
  useEffect(() => {
    fetchCategories();
    fetchResidents();
    fetchFeedbacks();
  }, []);

  // Update types when category changes
  useEffect(() => {
    setSelectedType("");
  }, [selectedCategory]);

  const [hasInstitutionAccess, setHasInstitutionAccess] = useState<
    boolean | null
  >(null);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getCategories();
      setCategories(extractApiData<CategoryResponse[]>(response) || []);
      setHasInstitutionAccess(true);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("Institution ID not found")
      ) {
        setHasInstitutionAccess(false);
        // Don't show toast here, will show message in UI
      } else if (
        error.code !== "ERR_NETWORK" &&
        error.code !== "ECONNREFUSED"
      ) {
        toast.error("Không thể tải danh mục. Vui lòng thử lại sau.");
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const response = await getResidentsByFamily();
      setResidents(extractApiData<ResidentResponse[]>(response) || []);
    } catch (error: any) {
      console.error("Failed to fetch residents:", error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await getFeedbacksByFamily();
      setSubmissions(extractApiData<FeedbackResponse[]>(response) || []);
    } catch (error: any) {
      console.error("Failed to fetch feedbacks:", error);
      if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
        toast.error("Không thể tải lịch sử feedback. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = categories.find(
    (cat) => cat.category_id === selectedCategory
  );

  const handleSubmit = async () => {
    if (!selectedCategory || !message) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    // Validate required fields from category metadata
    if (selectedCategoryData?.metadata?.requiredFields) {
      const requiredFields = selectedCategoryData.metadata.requiredFields;
      if (
        requiredFields.includes("resident_id") &&
        (!selectedResidentId || selectedResidentId === "none")
      ) {
        toast.error("Vui lòng chọn cư dân.");
        return;
      }
      if (requiredFields.includes("type") && !selectedType) {
        toast.error("Vui lòng chọn loại feedback.");
        return;
      }
    }

    // Validate attachments if required
    if (
      selectedCategoryData?.metadata?.attachmentsRequired &&
      attachments.length === 0
    ) {
      toast.error("Vui lòng đính kèm file.");
      return;
    }

    try {
      setSubmitting(true);

      // TODO: Upload attachments to media service if needed
      // For now, we'll skip attachment upload
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        // In the future, upload files to media service and get URLs
        // const uploadPromises = attachments.map(file => uploadFile(file));
        // const uploadResults = await Promise.all(uploadPromises);
        // attachmentUrls = uploadResults.map(r => r.data.url);
        toast.info("Tính năng upload file đang được phát triển.");
      }

      const feedbackData = {
        resident_id:
          selectedResidentId && selectedResidentId !== "none"
            ? selectedResidentId
            : undefined,
        category_id: selectedCategory,
        type: selectedType || undefined,
        message,
        attachments: attachmentUrls,
      };

      const response = await createFeedback(feedbackData);
      extractApiData<FeedbackResponse>(response);

      // Refresh feedbacks list
      await fetchFeedbacks();

      // Reset form
      setSelectedCategory("");
      setSelectedType("");
      setSelectedResidentId("");
      setMessage("");
      setAttachments([]);

      toast.success("Gửi feedback thành công!");
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể gửi feedback. Vui lòng thử lại sau."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (submission: FeedbackResponse) => {
    try {
      const response = await getFeedbackById(submission.feedback_id);
      setSelectedSubmission(
        extractApiData<FeedbackResponse>(response) || submission
      );
      setIsDialogOpen(true);
    } catch (error: any) {
      console.error("Failed to fetch feedback details:", error);
      setSelectedSubmission(submission);
      setIsDialogOpen(true);
    }
  };

  // Show message if no institution access
  if (hasInstitutionAccess === false) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card className="bg-white shadow-sm border rounded-xl p-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Chưa liên kết với viện dưỡng lão
            </h2>
            <p className="text-gray-600">
              Vui lòng liên kết tài khoản của bạn với một resident tại viện
              dưỡng lão trước khi sử dụng tính năng này.
            </p>
            <Button
              onClick={() => (window.location.href = path.familyResidents)}
              className="mt-4"
            >
              Đi đến trang "My Residents"
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1
        className="text-2xl font-bold mb-6 text-center"
        style={{ color: "#5985D8" }}
      >
        Feedback & Support
      </h1>

      {/* Submit Feedback Section */}
      <Card className="mb-8 bg-white shadow-sm border rounded-xl">
        <CardHeader>
          <CardTitle>Gửi Feedback hoặc Yêu cầu Hỗ trợ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCategories ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Danh mục *
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && categories.length > 0 ? (
                      categories.map((cat) => (
                      <SelectItem
                        key={cat.category_id}
                          value={cat.category_id || ""}
                        className="cursor-pointer"
                      >
                          {cat.name || "Unnamed Category"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        Không có danh mục
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {selectedCategoryData?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedCategoryData.description}
                  </p>
                )}
              </div>

              {selectedCategoryData?.metadata?.types &&
                selectedCategoryData.metadata.types.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Loại{" "}
                      {selectedCategoryData.metadata.requiredFields?.includes(
                        "type"
                      ) && "*"}
                    </label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategoryData.metadata.types &&
                        selectedCategoryData.metadata.types.length > 0 ? (
                          selectedCategoryData.metadata.types.map((type) => (
                          <SelectItem
                              key={type || "unknown"}
                              value={type || ""}
                            className="cursor-pointer"
                          >
                              {type || "Unknown"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-types" disabled>
                            Không có loại
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

              {residents.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cư dân{" "}
                    {selectedCategoryData?.metadata?.requiredFields?.includes(
                      "resident_id"
                    ) && "*"}
                  </label>
                  <Select
                    value={selectedResidentId}
                    onValueChange={setSelectedResidentId}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Chọn cư dân (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="cursor-pointer">
                        Không chọn
                      </SelectItem>
                      {residents && residents.length > 0 ? (
                        residents.map((resident) => (
                        <SelectItem
                          key={resident.resident_id}
                            value={resident.resident_id || ""}
                          className="cursor-pointer"
                        >
                            {resident.full_name || "Unknown Resident"}
                        </SelectItem>
                        ))
                      ) : null}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nội dung *
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mô tả feedback hoặc vấn đề của bạn"
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/5000 ký tự
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  File đính kèm{" "}
                  {selectedCategoryData?.metadata?.attachmentsRequired && "*"}
                </label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setAttachments(Array.from(e.target.files || []))
                  }
                  accept="image/*,.pdf,.doc,.docx"
                />
                {attachments.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Đã chọn {attachments.length} file
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full cursor-pointer transition-all duration-150 hover:bg-opacity-90"
                style={{ backgroundColor: "#5985D8" }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi Feedback"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feedback History Section */}
      <Card className="bg-white shadow-sm border rounded-xl">
        <CardHeader>
          <CardTitle>Lịch sử Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Chưa có feedback nào.
              </p>
            ) : (
              submissions.map((submission, index) => (
                <div key={submission.feedback_id}>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-150 rounded-lg cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getStatusColor(submission.status)}>
                          {mapStatusToFrontend(submission.status)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {submission.category?.name || "N/A"}
                        </span>
                        {submission.type && (
                          <span className="text-xs text-gray-500">
                            • {submission.type}
                          </span>
                        )}
                      </div>
                      {submission.resident && (
                        <p className="text-sm font-medium text-gray-700">
                          Cư dân: {submission.resident.full_name}
                          {submission.resident.room && (
                            <span className="text-gray-500">
                              {" "}
                              - Phòng {submission.resident.room.room_number}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {submission.message.substring(0, 150)}
                        {submission.message.length > 150 ? "..." : ""}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Gửi:{" "}
                        {new Date(submission.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(submission)}
                      className="ml-4 cursor-pointer"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                  {index < submissions.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Feedback</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <strong>Danh mục:</strong>{" "}
                {selectedSubmission.category?.name || "N/A"}
              </div>
              {selectedSubmission.type && (
                <div>
                  <strong>Loại:</strong> {selectedSubmission.type}
                </div>
              )}
              {selectedSubmission.resident && (
                <div>
                  <strong>Cư dân:</strong>{" "}
                  {selectedSubmission.resident.full_name}
                  {selectedSubmission.resident.room && (
                    <span className="text-gray-600">
                      {" "}
                      - Phòng {selectedSubmission.resident.room.room_number}
                    </span>
                  )}
                </div>
              )}
              <div>
                <strong>Nội dung:</strong>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedSubmission.message}
                </p>
              </div>
              <div>
                <strong>Trạng thái:</strong>{" "}
                <Badge className={getStatusColor(selectedSubmission.status)}>
                  {mapStatusToFrontend(selectedSubmission.status)}
                </Badge>
              </div>
              {selectedSubmission.staff_notes && (
                <div>
                  <strong>Ghi chú từ nhân viên:</strong>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedSubmission.staff_notes}
                  </p>
                </div>
              )}
              {selectedSubmission.assigned_staff && (
                <div>
                  <strong>Nhân viên phụ trách:</strong>{" "}
                  {selectedSubmission.assigned_staff.staffProfile?.full_name ||
                    "N/A"}
                </div>
              )}
              <div>
                <strong>Ngày gửi:</strong>{" "}
                {new Date(selectedSubmission.created_at).toLocaleString(
                  "vi-VN"
                )}
              </div>
              {selectedSubmission.resolved_at && (
                <div>
                  <strong>Ngày giải quyết:</strong>{" "}
                  {new Date(selectedSubmission.resolved_at).toLocaleString(
                    "vi-VN"
                  )}
                </div>
              )}
              {selectedSubmission.attachments &&
                selectedSubmission.attachments.length > 0 && (
                  <div>
                    <strong>File đính kèm:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedSubmission.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block"
                        >
                          File {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyFeedbackSupport;
