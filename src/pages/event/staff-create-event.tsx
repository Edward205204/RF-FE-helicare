import React, { useMemo, useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "react-select";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { toast } from "react-toastify";
import {
  createEvent,
  type CreateEventData,
  type EventType,
  type CareSubType,
  type EventFrequency,
  type CareConfiguration,
} from "@/apis/event.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import path from "@/constants/path";

// --- Types & Constants ---
type EventKind = "Care" | "Entertainment" | "Other";
type CareSubTypeLocal =
  | "VitalCheck"
  | "Therapy"
  | "MedicationAdmin"
  | "Hygiene"
  | "Meal"
  | "Other";
type Frequency = "OneTime" | "Daily" | "Weekly" | "Monthly";

const CARE_SUBTYPE_MAP: Record<string, CareSubType> = {
  vital_check: "VitalCheck",
  medication: "MedicationAdmin",
  hygiene: "Hygiene",
  therapy: "Therapy",
  meal: "Meal",
};

const FREQ_MAP: Record<string, EventFrequency> = {
  OneTime: "OneTime",
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
};

export default function StaffCreateEvent(): React.JSX.Element {
  const navigate = useNavigate();

  // --- State Management ---
  const [eventType, setEventType] = useState<EventKind>("Care");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Care-only fields
  const [careSubType, setCareSubType] =
    useState<CareSubTypeLocal>("VitalCheck");
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [freq, setFreq] = useState<Frequency>("OneTime");
  const [location, setLocation] = useState<string>("");

  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  // --- Refs for UX Improvement (Date Pickers) ---
  const scheduledAtRef = useRef<HTMLInputElement>(null);
  const endAtRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsResponse = await getRooms();
        setRooms(roomsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải dữ liệu phòng");
      }
    };
    fetchData();
  }, []);

  const valid = useMemo(() => {
    if (!scheduledAt || !endAt || !eventName.trim()) return false;
    if (eventType === "Care" && !careSubType) return false;
    return true;
  }, [scheduledAt, endAt, eventType, careSubType, eventName]);

  // --- Submit Handler ---
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startISO = new Date(scheduledAt).toISOString();
      const endISO = new Date(endAt).toISOString();

      const eventData: CreateEventData = {
        name: eventName,
        type: eventType,
        start_time: startISO,
        end_time: endISO,
        location: location || undefined, // Will default to institution name on backend
        room_ids: roomIds.length > 0 ? roomIds : undefined,
      };

      // Add care configuration only for Care events
      if (eventType === "Care") {
        const careConfig: CareConfiguration = {
          subType: CARE_SUBTYPE_MAP[careSubType.toLowerCase()] || "VitalCheck",
          frequency: freq !== "OneTime" ? FREQ_MAP[freq] : undefined,
        };
        eventData.care_configuration = careConfig;
      }

      console.log("📤 [createEvent] Sending event data:", eventData);
      const response = await createEvent(eventData);
      console.log("✅ [createEvent] Event created successfully!");
      console.log("📦 [createEvent] Response:", response);
      console.log("📦 [createEvent] Response.data:", response.data);

      toast.success("Tạo sự kiện thành công!");

      console.log("🧭 [createEvent] Navigating to manage-event with state:", {
        newEvent: response.data,
      });
      navigate(path.staffManageEvent, { state: { newEvent: response.data } });
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể tạo sự kiện. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen font-sans text-slate-900 bg-gray-50/50">
      {/* --- Background Decoration (Match UI Management) --- */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        {/* --- Header --- */}
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm hover:text-blue-500 transition-all cursor-pointer"
            onClick={() => navigate(path.staffManageEvent)}
          >
            <ArrowLeft className="h-5 w-5  text-inherit" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tạo sự kiện mới
            </h1>
            <p className="text-sm text-slate-500">
              Điền thông tin chi tiết để lên lịch hoạt động chăm sóc hoặc thăm
              hỏi gia đình.
            </p>
          </div>
        </div>

        <form
          onSubmit={onCreate}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* --- Left Column: Main Form --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. General Info Card */}
            <Card className="rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                  <CardTitle className="text-lg">Thông tin chung</CardTitle>
                </div>
                <CardDescription>
                  Chọn loại sự kiện và thông tin cơ bản.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {/* Event Type */}
                <div className="space-y-2">
                  <Label>Loại sự kiện *</Label>
                  <Select
                    value={eventType}
                    onValueChange={(v) => setEventType(v as EventKind)}
                  >
                    <SelectTrigger className="bg-white border-b border-slate-200">
                      <SelectValue placeholder="Chọn loại sự kiện" />
                    </SelectTrigger>
                    <SelectContent className="border-b border-slate-200 bg-white">
                      <SelectItem value="Care">Sự kiện chăm sóc</SelectItem>
                      <SelectItem value="Entertainment">Giải trí</SelectItem>
                      <SelectItem value="Other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Name */}
                <div className="space-y-2">
                  <Label>Tên sự kiện *</Label>
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Vd: Yoga buổi sáng, Kiểm tra định kỳ"
                    className="bg-white border-b border-slate-200"
                  />
                </div>

                {/* Date & Time (Improved UX with useRef) */}
                <div className="space-y-2">
                  <Label>Ngày & Giờ bắt đầu *</Label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => scheduledAtRef.current?.showPicker()}
                  >
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors z-10 " />
                    <Input
                      ref={scheduledAtRef}
                      type="datetime-local"
                      className="pl-10 bg-white cursor-pointer hover:border-blue-400 transition-colors border-b border-slate-200"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ngày & Giờ kết thúc *</Label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => endAtRef.current?.showPicker()}
                  >
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
                    <Input
                      ref={endAtRef}
                      name="end-datetime"
                      type="datetime-local"
                      className="pl-10 bg-white cursor-pointer hover:border-blue-400 transition-colors border-b border-slate-200"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                {/* <div className="space-y-2 md:col-span-2">
                  <Label>
                    Location (Optional - defaults to institution name)
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Leave empty to use institution name"
                    className="bg-white border-b border-slate-200"
                  />
                </div> */}
              </CardContent>
            </Card>

            {/* 2. Care Configuration Card (Conditional) */}
            {eventType === "Care" && (
              <Card className="rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                    <CardTitle className="text-lg">Cấu hình chăm sóc</CardTitle>
                  </div>
                  <CardDescription>
                    Phân công nhân viên và thiết lập chi tiết danh mục.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Loại phụ *</Label>
                    <Select
                      value={careSubType}
                      onValueChange={(v) =>
                        setCareSubType(v as CareSubTypeLocal)
                      }
                    >
                      <SelectTrigger className="bg-white border-b border-slate-200">
                        <SelectValue placeholder="Chọn loại phụ" />
                      </SelectTrigger>
                      <SelectContent className="border-b border-slate-200 bg-white">
                        <SelectItem value="VitalCheck">
                          Kiểm tra sinh hiệu
                        </SelectItem>
                        <SelectItem value="Therapy">Trị liệu</SelectItem>
                        <SelectItem value="MedicationAdmin">
                          Quản lý thuốc
                        </SelectItem>
                        <SelectItem value="Hygiene">Vệ sinh</SelectItem>
                        <SelectItem value="Meal">
                          Bữa ăn / Dinh dưỡng
                        </SelectItem>
                        <SelectItem value="Other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tần suất</Label>
                    <Select
                      value={freq}
                      onValueChange={(v) => setFreq(v as Frequency)}
                    >
                      <SelectTrigger className="bg-white border-b border-slate-200">
                        <SelectValue placeholder="Chọn tần suất" />
                      </SelectTrigger>
                      <SelectContent className="border-b border-slate-200 bg-white">
                        <SelectItem value="OneTime">Một lần</SelectItem>
                        <SelectItem value="Daily">Hàng ngày</SelectItem>
                        <SelectItem value="Weekly">Hàng tuần</SelectItem>
                        <SelectItem value="Monthly">Hàng tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-room selection for special care events */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>
                      Phòng (Tùy chọn - cho sự kiện chăm sóc đặc biệt)
                    </Label>
                    <MultiSelect
                      options={rooms.map((room) => ({
                        value: room.room_id,
                        label: `Phòng ${room.room_number} (${room.type})`,
                      }))}
                      value={rooms
                        .filter((r) => roomIds.includes(r.room_id))
                        .map((r) => ({
                          value: r.room_id,
                          label: `Phòng ${r.room_number} (${r.type})`,
                        }))}
                      onChange={(selected) =>
                        setRoomIds(
                          (selected || []).map((option) => option.value)
                        )
                      }
                      placeholder="Chọn phòng (tùy chọn)..."
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          borderColor: "#e2e8f0",
                          minHeight: "40px",
                          fontSize: "0.875rem",
                        }),
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* --- Right Column: Summary --- */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl border-gray-200 shadow-md bg-white sticky top-24">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-base font-semibold text-center text-slate-800">
                  Tóm tắt sự kiện
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Timeline Visual */}
                <div className="flex gap-3 items-start">
                  <div className="mt-1 bg-blue-100 p-1.5 rounded-md">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">Lịch trình</p>
                    <p className="text-slate-500">
                      Bắt đầu:{" "}
                      {scheduledAt
                        ? new Date(scheduledAt).toLocaleString("en-US")
                        : "—"}
                    </p>
                    <p className="text-slate-500">
                      Kết thúc:{" "}
                      {endAt ? new Date(endAt).toLocaleString("en-US") : "—"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200"></div>

                {/* Details List */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại</span>
                    <Badge variant="outline" className="capitalize">
                      {eventType}
                    </Badge>
                  </div>

                  {eventType === "Care" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Loại phụ</span>
                        <span className="font-medium">{careSubType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tần suất</span>
                        <span className="font-medium">{freq}</span>
                      </div>
                      {roomIds.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phòng</span>
                          <span className="font-medium">
                            Đã chọn {roomIds.length}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {location && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Địa điểm</span>
                      <span className="font-medium truncate max-w-[120px]">
                        {location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Validation Warning */}
                {!valid && (
                  <div className="flex gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-xs items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Vui lòng hoàn thành tất cả các trường bắt buộc (Loại sự
                      kiện, Tên sự kiện, Ngày bắt đầu, Ngày kết thúc
                      {eventType === "Care" ? ", Loại phụ" : ""}).
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={!valid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        Đang tạo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Xác nhận & Tạo
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-700"
                    onClick={() => navigate(path.staffManageEvent)}
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
