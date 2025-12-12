import React, { useEffect, useMemo, useState, useContext } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Separator } from "@/components/ui";
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import {
  getFeedbacksByFamily,
  type FeedbackResponse,
} from "@/apis/feedback.api";
import { getPosts, type Post } from "@/apis/post.api";
import {
  getHealthSummary,
  type HealthSummaryResponse,
} from "@/apis/assessment.api";
import {
  getFamilyNotificationsLastSeen,
  getFamilyReadNotificationIds,
  markFamilyNotificationsAllRead,
  markFamilyNotificationsRead,
} from "@/apis/notification.api";
import { AppContext } from "@/contexts/app.context";

type NotificationSource = "feedback" | "post" | "health";
type NotificationSeverity = "info" | "warning" | "critical";

interface FamilyNotification {
  id: string;
  source: NotificationSource;
  title: string;
  message: string;
  createdAt: string;
  residentName?: string;
  relatedResidentId?: string;
  severity: NotificationSeverity;
  isRead: boolean;
}

const FamilyNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationSource | "all">("all");
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<FamilyNotification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setFamilyUnreadNotifications } = useContext(AppContext);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Lấy mốc last_seen + danh sách ID đã đọc từ backend
      let backendLastSeen: Date | null = null;
      let readIds: string[] = [];
      try {
        const [lastSeenRes, readIdsRes] = await Promise.all([
          getFamilyNotificationsLastSeen(),
          getFamilyReadNotificationIds(),
        ]);

        if (lastSeenRes.data?.last_seen) {
          backendLastSeen = new Date(lastSeenRes.data.last_seen);
        }
        readIds = readIdsRes.data?.ids || [];
      } catch (e) {
        console.warn(
          "Failed to load family notifications last_seen from BE",
          e
        );
      }

      // 2) Residents linked to this family
      const residentsRes = await getResidentsByFamily();
      const residents: ResidentResponse[] = residentsRes.data || [];
      const residentMap = new Map<string, ResidentResponse>();
      residents.forEach((r) => residentMap.set(r.resident_id, r));

      // 3) Feedbacks by family
      const feedbackRes = await getFeedbacksByFamily();
      const feedbacks: FeedbackResponse[] = feedbackRes.data || [];

      const feedbackNotifications: FamilyNotification[] = feedbacks.map(
        (fb) => ({
          id: `fb:${fb.feedback_id}`,
          source: "feedback",
          title: `Feedback update: ${fb.category?.name || "Other"}`,
          message:
            fb.status === "resolved"
              ? "Your feedback has been resolved."
              : fb.status === "in_progress"
              ? "Your feedback is being processed by the team."
              : "New feedback has been recorded.",
          createdAt: fb.updated_at || fb.created_at,
          residentName: fb.resident?.full_name,
          relatedResidentId: fb.resident?.resident_id || undefined,
          severity:
            fb.status === "resolved"
              ? "info"
              : fb.status === "in_progress"
              ? "warning"
              : "info",
          isRead: false,
        })
      );

      // 4) Posts from institution
      const postsRes = await getPosts({ limit: 20, filter: "Week" });
      const posts: Post[] = postsRes.data || [];

      const postNotifications: FamilyNotification[] = posts.map((post) => ({
        id: `post:${post.id}`,
        source: "post",
        title: post.title || "New notification from institution",
        message: post.content.slice(0, 200),
        createdAt: post.createdAt,
        severity: "info",
        isRead: false,
      }));

      // 5) Health alerts from health-summary
      const healthNotifications: FamilyNotification[] = [];
      for (const r of residents) {
        try {
          const hsRes = await getHealthSummary(r.resident_id);
          const hs: HealthSummaryResponse = hsRes.data;
          hs.alerts.forEach((alert) => {
            healthNotifications.push({
              id: `health:${r.resident_id}:${alert.id}`,
              source: "health",
              title: `Health alert for ${r.full_name}`,
              message: alert.message,
              createdAt: hs.meta.generated_at,
              residentName: r.full_name,
              relatedResidentId: r.resident_id,
              severity: alert.severity,
              isRead: false,
            });
          });
        } catch (e) {
          // Nếu 1 resident không có health summary thì bỏ qua, không fail toàn bộ
          console.warn(
            "Failed to load health summary for resident",
            r.resident_id
          );
        }
      }

      // Gộp & sort
      let merged: FamilyNotification[] = [
        ...feedbackNotifications,
        ...postNotifications,
        ...healthNotifications,
      ];

      merged.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Đặt trạng thái read:
      // - Ưu tiên theo danh sách ID đã đọc
      // - Fallback thêm theo lastSeen (giữ tương thích)
      const lastSeen = backendLastSeen;
      merged = merged.map((n) => {
        const byId = readIds.includes(n.id);
        const byLastSeen =
          !!lastSeen && new Date(n.createdAt) <= (lastSeen as Date);
        return {
          ...n,
          isRead: byId || byLastSeen,
        };
      });

      setNotifications(merged);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(
        err.response?.data?.message ||
          "Cannot load notifications. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.source === activeTab);
  }, [notifications, activeTab]);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  useEffect(() => {
    if (setFamilyUnreadNotifications) {
      setFamilyUnreadNotifications(unreadNotifications.length);
    }
  }, [unreadNotifications.length, setFamilyUnreadNotifications]);

  const markAllAsRead = async () => {
    try {
      const allIds = notifications.map((n) => n.id);
      const res = await markFamilyNotificationsRead(allIds);
      const readIds = res.data?.ids || [];

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          // Giữ lại những cái đã read trước đó, cộng thêm những ID mới từ backend
          isRead: n.isRead || readIds.includes(n.id),
        }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await markFamilyNotificationsRead([id]);
      const readIds = res.data?.ids || [];

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          // Không reset các thông báo đã read trước đó
          isRead: n.isRead || readIds.includes(n.id),
        }))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Fallback: chỉ update local nếu BE lỗi
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleViewDetails = (notification: FamilyNotification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    void markAsRead(notification.id);
  };

  const getSeverityColor = (severity: NotificationSeverity) => {
    switch (severity) {
      case "info":
        return "bg-blue-500";
      case "warning":
        return "bg-yellow-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSourceLabel = (source: NotificationSource) => {
    switch (source) {
      case "health":
        return "Health";
      case "feedback":
        return "Feedback";
      case "post":
        return "Post";
      default:
        return "";
    }
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl bg-gradient-to-r from-blue-50 to-white min-h-screen">
      <h1
        className="text-3xl font-bold mb-6 text-center"
        style={{ color: "#5985D8" }}
      >
        Notification Center
      </h1>

      {/* Unread Notifications Section */}
      {unreadNotifications.length > 0 && (
        <Card className="mb-6 shadow-lg rounded-lg">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-white rounded-t-lg">
            <CardTitle className="flex justify-between items-center">
              Unread Notifications ({unreadNotifications.length})
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                style={{ borderColor: "#5985D8", color: "#5985D8" }}
              >
                Mark All as Read
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 custom-scroll overflow-x-hidden">
              {unreadNotifications.map((notification, index) => (
                <div key={notification.id} className="mb-4">
                  <Card className="p-4 shadow-sm rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge
                            className={getSeverityColor(notification.severity)}
                          >
                            {notification.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            {getSourceLabel(notification.source)}
                          </span>
                        </div>
                        {notification.residentName && (
                          <p className="font-semibold">
                            {notification.residentName}
                          </p>
                        )}
                        <p className="text-sm font-semibold">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(notification)}
                        style={{ borderColor: "#5985D8", color: "#5985D8" }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                  {index < unreadNotifications.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Filtering */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as NotificationSource | "all")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 mb-6 rounded-lg bg-white shadow-sm">
          <TabsTrigger value="all" className="rounded-md">
            All
          </TabsTrigger>
          <TabsTrigger value="health" className="rounded-md">
            Health
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-md">
            Feedback
          </TabsTrigger>
          <TabsTrigger value="post" className="rounded-md">
            Post
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="shadow-lg rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-white rounded-t-lg">
              <CardTitle>
                {activeTab === "all"
                  ? "All Notifications"
                  : activeTab === "health"
                  ? "Health Notifications"
                  : activeTab === "feedback"
                  ? "Feedback Notifications"
                  : "Post Notifications"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 custom-scroll overflow-x-hidden">
                {loading ? (
                  <p className="text-center text-gray-500">
                    Loading notifications...
                  </p>
                ) : error ? (
                  <p className="text-center text-red-500">{error}</p>
                ) : filteredNotifications.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No notifications in this category.
                  </p>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <div key={notification.id} className="mb-4">
                      <Card
                        className={`p-4 shadow-sm rounded-lg hover:shadow-md transition-shadow ${
                          !notification.isRead
                            ? "border-l-4 border-blue-500 bg-blue-50"
                            : "bg-white opacity-70"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                className={getSeverityColor(
                                  notification.severity
                                )}
                              >
                                {notification.severity.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium">
                                {getSourceLabel(notification.source)}
                              </span>
                              {!notification.isRead && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  Unread
                                </Badge>
                              )}
                            </div>
                            {notification.residentName && (
                              <p className="font-semibold">
                                {notification.residentName}
                              </p>
                            )}
                            <p className="text-sm font-semibold">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 truncate mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(notification)}
                            style={{ borderColor: "#5985D8", color: "#5985D8" }}
                          >
                            View Details
                          </Button>
                        </div>
                      </Card>
                      {index < filteredNotifications.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <strong>Resident:</strong>{" "}
                {selectedNotification.residentName || "—"}
              </div>
              <div>
                <strong>Type:</strong>{" "}
                {getSourceLabel(selectedNotification.source)}
              </div>
              <div>
                <strong>Severity:</strong>
                <Badge
                  className={`ml-2 ${getSeverityColor(
                    selectedNotification.severity
                  )}`}
                >
                  {selectedNotification.severity.toUpperCase()}
                </Badge>
              </div>
              <div>
                <strong>Time:</strong>{" "}
                {formatDateTime(selectedNotification.createdAt)}
              </div>
              <div>
                <strong>Content:</strong> {selectedNotification.message}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyNotifications;
