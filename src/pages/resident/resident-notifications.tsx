import React, { useState } from "react";
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

const ResidentNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationSource | "all">("all");
  // EMPTY STATE: No notifications
  const [notifications, setNotifications] = useState<FamilyNotification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<FamilyNotification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No API calls for loading notifications

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.source === activeTab;
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Mock functions for interactions
  const markAllAsRead = async () => {
    // No-op in empty state
    console.log("Mark all as read - Empty State");
  };

  const handleViewDetails = (notification: FamilyNotification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    // markAsRead logic removed
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
        return "Sức khỏe";
      case "feedback":
        return "Phản hồi";
      case "post":
        return "Bài viết";
      default:
        return "";
    }
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full relative">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-r from-blue-50 to-white"></div>
      <div className="relative z-10 container mx-auto p-4 max-w-6xl min-h-screen">
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: "#5985D8" }}
        >
          Trung tâm thông báo
        </h1>

        {/* Unread Notifications Section - Hidden if empty */}
        {unreadNotifications.length > 0 && (
          <Card className="mb-6 shadow-lg rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-white rounded-t-lg">
              <CardTitle className="flex justify-between items-center">
                Thông báo chưa đọc ({unreadNotifications.length})
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  size="sm"
                  style={{ borderColor: "#5985D8", color: "#5985D8" }}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">{/* Empty wrapper */}</CardContent>
          </Card>
        )}

        {/* Tabs for Filtering */}
        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            setActiveTab(val as NotificationSource | "all")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6 rounded-lg bg-white shadow-sm">
            <TabsTrigger value="all" className="rounded-md">
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="health" className="rounded-md">
              Sức khỏe
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-md">
              Phản hồi
            </TabsTrigger>
            <TabsTrigger value="post" className="rounded-md">
              Bài viết
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <Card className="shadow-lg rounded-lg">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-white rounded-t-lg">
                <CardTitle>
                  {activeTab === "all"
                    ? "Tất cả thông báo"
                    : activeTab === "health"
                    ? "Thông báo sức khỏe"
                    : activeTab === "feedback"
                    ? "Thông báo phản hồi"
                    : "Thông báo bài viết"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4 custom-scroll overflow-x-hidden">
                  {loading ? (
                    <p className="text-center text-gray-500">
                      Đang tải thông báo...
                    </p>
                  ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                  ) : filteredNotifications.length === 0 ? (
                    <p className="text-center text-gray-500">
                      Không có thông báo nào trong mục này.
                    </p>
                  ) : (
                    filteredNotifications.map((notification, index) => (
                      <div key={notification.id} className="mb-4">
                        {/* Render Item Logic - Unused in empty state */}
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
              <DialogTitle>Chi tiết thông báo</DialogTitle>
            </DialogHeader>
            {selectedNotification && (
              <div className="space-y-4">
                <div>
                  <strong>Người thân:</strong>{" "}
                  {selectedNotification.residentName || "—"}
                </div>
                <div>
                  <strong>Loại:</strong>{" "}
                  {getSourceLabel(selectedNotification.source)}
                </div>
                <div>
                  <strong>Mức độ:</strong>
                  <Badge
                    className={`ml-2 ${getSeverityColor(
                      selectedNotification.severity
                    )}`}
                  >
                    {selectedNotification.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <strong>Thời gian:</strong>{" "}
                  {formatDateTime(selectedNotification.createdAt)}
                </div>
                <div>
                  <strong>Nội dung:</strong> {selectedNotification.message}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ResidentNotifications;
