// StaffSOSIncidentManagement.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Calendar } from "@/components/ui";
import { Textarea } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { toast } from "react-toastify";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns/format";

// Mock data for alerts
interface Alert {
  id: string;
  residentName: string;
  roomBed: string;
  type: "fall" | "abnormal_vitals" | "emergency_button";
  timestamp: string;
  vitalSnapshot?: string; // e.g., "BP: 180/110, HR: 120"
  severity: "high" | "medium" | "low"; // For color coding
  status: "pending" | "acknowledged" | "in_progress" | "resolved" | "escalated";
  timer: number; // Countdown in seconds
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    residentName: "John Doe",
    roomBed: "Room 101, Bed A",
    type: "fall",
    timestamp: "2023-10-01 14:30:00",
    vitalSnapshot: "BP: 120/80, HR: 72",
    severity: "high",
    status: "pending",
    timer: 60,
  },
  {
    id: "2",
    residentName: "Jane Smith",
    roomBed: "Room 102, Bed B",
    type: "abnormal_vitals",
    timestamp: "2023-10-01 15:00:00",
    vitalSnapshot: "BP: 180/110, HR: 120, Glucose: 12.5",
    severity: "high",
    status: "pending",
    timer: 60,
  },
  {
    id: "3",
    residentName: "Bob Johnson",
    roomBed: "Room 103, Bed C",
    type: "emergency_button",
    timestamp: "2023-10-01 15:15:00",
    severity: "medium",
    status: "pending",
    timer: 60,
  },
];

// Mock data for residents
const mockResidents = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Bob Johnson" },
];

interface IncidentReport {
  id: string;
  residentId: string;
  incidentType: string;
  rootCause: string;
  actionsTaken: string;
  outcome: string;
  timeOccurred: string;
  dateOccurred: string;
  staffOnDuty: string;
  images: File[];
}

// Mock data for reported incidents
const mockReportedIncidents: IncidentReport[] = [
  {
    id: "1",
    residentId: "1",
    incidentType: "fall",
    rootCause: "Slippery floor",
    actionsTaken: "Assisted resident, called nurse",
    outcome: "Stabilized, monitored for 24 hours",
    timeOccurred: "14:30",
    dateOccurred: "2023-10-01",
    staffOnDuty: "Alice Johnson",
    images: [],
  },
  {
    id: "2",
    residentId: "2",
    incidentType: "health_event",
    rootCause: "Unknown",
    actionsTaken: "Administered medication, contacted doctor",
    outcome: "Transferred to hospital",
    timeOccurred: "15:00",
    dateOccurred: "2023-10-01",
    staffOnDuty: "Bob Smith",
    images: [],
  },
];

// --- STYLES ---
const CARD_STYLE = "bg-white border-none shadow-sm";
const INPUT_STYLE =
  "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 transition-colors";
const BADGE_STYLE = "shadow-sm text-white";

const ALERT_TYPE_MAP: Record<string, string> = {
  fall: "Ngã",
  abnormal_vitals: "Chỉ số bất thường",
  emergency_button: "Nút khẩn cấp",
};

const ALERT_STATUS_MAP: Record<string, string> = {
  pending: "Chờ xử lý",
  acknowledged: "Đã xác nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  escalated: "Đã leo thang",
};

const INCIDENT_TYPE_MAP: Record<string, string> = {
  fall: "Ngã",
  health_event: "Sự cố sức khỏe",
  behavioral: "Hành vi",
  environmental_hazard: "Hiểm họa môi trường",
};

const StaffSOSIncidentManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [reportedIncidents, setReportedIncidents] = useState<IncidentReport[]>(
    mockReportedIncidents
  );
  const [report, setReport] = useState<IncidentReport>({
    id: "",
    residentId: "",
    incidentType: "",
    rootCause: "",
    actionsTaken: "",
    outcome: "",
    timeOccurred: "",
    dateOccurred: "",
    staffOnDuty: "",
    images: [],
  });
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Timer logic: Decrement timer for pending alerts every second
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.status === "pending" && alert.timer > 0
            ? { ...alert, timer: alert.timer - 1 }
            : alert.timer === 0 && alert.status === "pending"
            ? { ...alert, status: "escalated" } // Auto-escalate if timer hits 0
            : alert
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle acknowledge alert
  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: "acknowledged" } : alert
      )
    );
    toast("Cảnh báo đã được xác nhận — Bạn đã xác nhận cảnh báo.");
  };

  // Handle mark in progress
  const markInProgress = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: "in_progress" } : alert
      )
    );
    toast("Cảnh báo đang xử lý — Cảnh báo đã được đánh dấu là đang xử lý.");
  };

  // Handle resolve alert
  const resolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: "resolved" } : alert
      )
    );
    setResolutionNotes("");
    setResolutionNotes("");
    toast("Cảnh báo đã giải quyết — Cảnh báo đã được giải quyết.");
  };

  // Open incident report dialog, pre-populate with alert data if available
  const openIncidentReport = (alert?: Alert) => {
    if (alert) {
      setReport({
        ...report,
        residentId:
          mockResidents.find((r) => r.name === alert.residentName)?.id || "",
        incidentType: alert.type,
        timeOccurred: alert.timestamp.split(" ")[1] || "",
        dateOccurred: alert.timestamp.split(" ")[0] || "",
      });
      setDate(new Date(alert.timestamp));
    }
    setIsIncidentDialogOpen(true);
  };

  // Handle incident report submission
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation: Check required fields
    if (
      !report.residentId ||
      !report.incidentType ||
      !report.actionsTaken ||
      !report.outcome
    ) {
      toast("Lỗi xác thực — Vui lòng điền tất cả các trường bắt buộc.");
      return;
    }
    // Mock submit logic: Add to reported incidents
    const newReport: IncidentReport = {
      ...report,
      id: Date.now().toString(),
      dateOccurred: date?.toISOString().split("T")[0] || "",
    };
    setReportedIncidents([newReport, ...reportedIncidents]);
    console.log("Incident Report Submitted:", newReport);
    toast("Gửi báo cáo — Báo cáo sự cố đã được gửi thành công.");
    // Reset form
    setReport({
      id: "",
      residentId: "",
      incidentType: "",
      rootCause: "",
      actionsTaken: "",
      outcome: "",
      timeOccurred: "",
      dateOccurred: "",
      staffOnDuty: "",
      images: [],
    });
    setDate(new Date());
    setIsIncidentDialogOpen(false);
  };

  // Handle file upload (mock)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setReport({ ...report, images: [...report.images, ...files] });
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-300";
      case "medium":
        return "bg-yellow-200";
      case "low":
        return "bg-green-300";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-radial from-helicare-blue to-white p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* SOS Alerts Section */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              Cảnh báo SOS đang hoạt động
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  // Updated class: white bg, no black border, shadow-sm, keeping severity color
                  className={`${CARD_STYLE} border-l-4 ${getSeverityColor(
                    alert.severity
                  )}`}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{alert.residentName}</span>
                      <Badge
                        className={
                          BADGE_STYLE +
                          " " +
                          (alert.status === "pending"
                            ? "bg-red-500"
                            : alert.status === "acknowledged"
                            ? "bg-yellow-500"
                            : alert.status === "in_progress"
                            ? "bg-blue-500"
                            : alert.status === "resolved"
                            ? "bg-green-500"
                            : "bg-violet-500")
                        }
                      >
                        {ALERT_STATUS_MAP[alert.status] || alert.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Phòng/Giường:</strong> {alert.roomBed}
                    </p>
                    <p>
                      <strong>Loại:</strong>{" "}
                      {ALERT_TYPE_MAP[alert.type] || alert.type}
                    </p>
                    <p>
                      <strong>Thời gian:</strong> {alert.timestamp}
                    </p>
                    {alert.vitalSnapshot && (
                      <p>
                        <strong>Dấu hiệu sinh tồn:</strong>{" "}
                        {alert.vitalSnapshot}
                      </p>
                    )}
                    {alert.status === "pending" && (
                      <p className="text-red-600 font-bold">
                        Thời gian: {alert.timer}s
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {alert.status === "pending" && (
                        <Button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-[#5985d8] hover:bg-[#4a6fc1] shadow-sm cursor-pointer"
                        >
                          Xác nhận
                        </Button>
                      )}
                      {alert.status === "acknowledged" && (
                        <Button
                          onClick={() => markInProgress(alert.id)}
                          className="bg-[#f59e0b] hover:bg-[#d97706] shadow-sm cursor-pointer"
                        >
                          Đang xử lý
                        </Button>
                      )}
                      {(alert.status === "acknowledged" ||
                        alert.status === "in_progress") && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedAlert(alert)}
                              className="bg-[#22c55e] hover:bg-[#16a34a] shadow-sm cursor-pointer"
                            >
                              Giải quyết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white">
                            <DialogHeader>
                              <DialogTitle>Giải quyết cảnh báo</DialogTitle>
                            </DialogHeader>
                            <textarea
                              placeholder="Ghi chú giải quyết..."
                              value={resolutionNotes}
                              onChange={(e) =>
                                setResolutionNotes(e.target.value)
                              }
                              className={`w-full p-2 rounded ${INPUT_STYLE}`}
                            />
                            <Button
                              onClick={() => resolveAlert(alert.id)}
                              className="bg-[#5985d8] hover:bg-[#4a6fc1] shadow-sm cursor-pointer"
                            >
                              Gửi giải quyết
                            </Button>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Dialog
                        open={isIncidentDialogOpen}
                        onOpenChange={setIsIncidentDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => openIncidentReport(alert)}
                            variant="outline"
                            // Update class button outline: white bg, gray border, shadow
                            className="bg-white border-gray-200 text-[#5985d8] hover:bg-gray-50 shadow-sm cursor-pointer"
                          >
                            Tạo báo cáo sự cố
                          </Button>
                        </DialogTrigger>
                        {/* Update DialogContent: bg-white */}
                        <DialogContent className="bg-white max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Biểu mẫu báo cáo sự cố</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={handleSubmitReport}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Cư dân *
                                </label>
                                <Select
                                  value={report.residentId}
                                  onValueChange={(value: string) =>
                                    setReport({ ...report, residentId: value })
                                  }
                                >
                                  <SelectTrigger className={INPUT_STYLE}>
                                    <SelectValue placeholder="Chọn cư dân" />
                                  </SelectTrigger>
                                  {/* Update SelectContent: bg-white */}
                                  <SelectContent className="bg-white">
                                    {mockResidents.map((res) => (
                                      <SelectItem key={res.id} value={res.id}>
                                        {res.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Loại sự cố *
                                </label>
                                <Select
                                  value={report.incidentType}
                                  onValueChange={(value: string) =>
                                    setReport({
                                      ...report,
                                      incidentType: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className={INPUT_STYLE}>
                                    <SelectValue placeholder="Chọn loại" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="fall">Ngã</SelectItem>
                                    <SelectItem value="health_event">
                                      Sự cố sức khỏe
                                    </SelectItem>
                                    <SelectItem value="behavioral">
                                      Hành vi
                                    </SelectItem>
                                    <SelectItem value="environmental_hazard">
                                      Hiểm họa môi trường
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium">
                                  Ngày xảy ra
                                </label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="relative">
                                      {/* Update Input: bg-gray-50, border-gray-200 */}
                                      <input
                                        readOnly
                                        value={
                                          date ? format(date, "yyyy-MM-dd") : ""
                                        }
                                        placeholder="Chọn ngày"
                                        className={`w-full rounded-md px-3 py-2 text-sm cursor-pointer ${INPUT_STYLE}`}
                                      />

                                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                    </div>
                                  </PopoverTrigger>

                                  {/* Update PopoverContent: bg-white */}
                                  <PopoverContent
                                    className="p-0 scale-75 origin-top-left bg-white border-gray-200"
                                    side="bottom"
                                    align="start"
                                    sideOffset={4}
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={date ?? undefined}
                                      onSelect={(d: Date | undefined) =>
                                        d && setDate(d)
                                      }
                                      initialFocus
                                      className="bg-white"
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {/* time */}
                              <div className="flex flex-col space-y-1">
                                <label className="text-sm font-medium">
                                  Thời gian xảy ra
                                </label>

                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        readOnly
                                        placeholder="Chọn thời gian"
                                        value={report.timeOccurred}
                                        className={`cursor-pointer text-sm ${INPUT_STYLE}`}
                                      />

                                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none" />
                                    </div>
                                  </PopoverTrigger>

                                  <PopoverContent
                                    className="p-3 w-48 scale-90 bg-white border-gray-200"
                                    side="bottom"
                                    align="start"
                                    sideOffset={4}
                                  >
                                    <div className="grid grid-cols-2 gap-2">
                                      {/* Hours */}
                                      <Select
                                        onValueChange={(val: string) => {
                                          const minutes =
                                            report.timeOccurred.split(":")[1] ||
                                            "00";
                                          setReport({
                                            ...report,
                                            timeOccurred: `${val}:${minutes}`,
                                          });
                                        }}
                                      >
                                        <SelectTrigger
                                          className={`h-8 px-2 text-sm ${INPUT_STYLE}`}
                                        >
                                          <SelectValue placeholder="Giờ" />
                                        </SelectTrigger>

                                        <SelectContent className="max-h-40 text-sm bg-white">
                                          {Array.from(
                                            { length: 24 },
                                            (_, i) => {
                                              const hr = String(i).padStart(
                                                2,
                                                "0"
                                              );
                                              return (
                                                <SelectItem key={hr} value={hr}>
                                                  {hr}
                                                </SelectItem>
                                              );
                                            }
                                          )}
                                        </SelectContent>
                                      </Select>

                                      {/* Minutes */}
                                      <select
                                        className={`rounded-md p-2 text-sm appearance-none scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 ${INPUT_STYLE}`}
                                        value={
                                          report.timeOccurred.split(":")[1] ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          const [h] =
                                            report.timeOccurred.split(":");
                                          const minutes = e.target.value;
                                          setReport({
                                            ...report,
                                            timeOccurred: `${
                                              h || "00"
                                            }:${minutes}`,
                                          });
                                        }}
                                      >
                                        <option value="">Phút</option>
                                        {[
                                          "00",
                                          "05",
                                          "10",
                                          "15",
                                          "20",
                                          "25",
                                          "30",
                                          "35",
                                          "40",
                                          "45",
                                          "50",
                                          "55",
                                        ].map((m) => (
                                          <option key={m} value={m}>
                                            {m}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium">
                                Nguyên nhân gốc rễ
                              </label>
                              <Textarea
                                placeholder="Mô tả nguyên nhân gốc rễ nếu biết..."
                                value={report.rootCause}
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  setReport({
                                    ...report,
                                    rootCause: e.target.value,
                                  })
                                }
                                className={INPUT_STYLE}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">
                                Hành động đã thực hiện *
                              </label>
                              <Textarea
                                placeholder="Chi tiết hành động đã thực hiện..."
                                value={report.actionsTaken}
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  setReport({
                                    ...report,
                                    actionsTaken: e.target.value,
                                  })
                                }
                                className={INPUT_STYLE}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">
                                Kết quả *
                              </label>
                              <Textarea
                                placeholder="Mô tả kết quả (ví dụ: ổn định, chuyển viện)..."
                                value={report.outcome}
                                onChange={(
                                  e: React.ChangeEvent<HTMLTextAreaElement>
                                ) =>
                                  setReport({
                                    ...report,
                                    outcome: e.target.value,
                                  })
                                }
                                className={INPUT_STYLE}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium">
                                  Nhân viên trực
                                </label>
                                <Input
                                  placeholder="Nhập tên nhân viên"
                                  value={report.staffOnDuty}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    setReport({
                                      ...report,
                                      staffOnDuty: e.target.value,
                                    })
                                  }
                                  className={INPUT_STYLE}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium">
                                  Tải ảnh lên (Tùy chọn)
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileUpload}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100
                                    mt-1"
                                />
                                {report.images.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-md px-2 border border-gray-100">
                                    Đã chọn {report.images.length} tệp
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <Button
                                type="submit"
                                className="bg-[#5985d8] hover:bg-[#4a6fc1] shadow-sm cursor-pointer"
                              >
                                Gửi báo cáo
                              </Button>
                              <Button
                                type="button"
                                onClick={() => setIsIncidentDialogOpen(false)}
                                variant="secondary"
                                className="shadow-sm bg-gray-100 border border-gray-200 hover:bg-gray-200 cursor-pointer"
                              >
                                Hủy
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
        {/* Reported Incidents Table Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 w-full text-center">
            Sự cố đã báo cáo
          </h2>
          <Card className={CARD_STYLE}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100">
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Cư dân
                      </TableHead>
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Loại sự cố
                      </TableHead>
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Ngày/Giờ
                      </TableHead>
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Hành động đã thực hiện
                      </TableHead>
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Kết quả
                      </TableHead>
                      <TableHead className="text-lg font-semibold text-center text-gray-700">
                        Nhân viên
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportedIncidents.map((incident) => (
                      <TableRow
                        key={incident.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell>
                          {mockResidents.find(
                            (r) => r.id === incident.residentId
                          )?.name || "Không rõ"}
                        </TableCell>
                        <TableCell>
                          {INCIDENT_TYPE_MAP[incident.incidentType] ||
                            incident.incidentType}
                        </TableCell>
                        <TableCell>
                          {incident.dateOccurred} {incident.timeOccurred}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {incident.actionsTaken}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {incident.outcome}
                        </TableCell>
                        <TableCell>{incident.staffOnDuty}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default StaffSOSIncidentManagement;
