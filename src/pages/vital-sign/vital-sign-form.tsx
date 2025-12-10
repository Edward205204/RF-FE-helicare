import { useEffect, useMemo, useState, FormEvent } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  createAssessment,
  updateAssessment,
  type AssessmentResponse,
} from "@/apis/assessment.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import { updateCareLog } from "@/apis/carelog.api";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  Badge,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useHealthSummary } from "@/hooks/use-health-summary";

type Level = "normal" | "warn" | "danger";

const PRIMARY = "#5985D8";
const BG =
  "radial-gradient(120% 120% at 0% 100%, #dfe9ff 0%, #ffffff 45%, #efd8d3 100%)";

const severityColors: Record<"normal" | "warning" | "critical", string> = {
  normal: "text-emerald-600 bg-emerald-50 border-emerald-100",
  warning: "text-amber-600 bg-amber-50 border-amber-100",
  critical: "text-red-600 bg-red-50 border-red-100",
};

const PRESET = {
  Morning: {
    systolic: 120,
    diastolic: 75,
    heartRate: 72,
    temperature: 36.6,
    respiration: 16,
    spo2: 97,
  },
  Afternoon: {
    systolic: 118,
    diastolic: 74,
    heartRate: 70,
    temperature: 36.6,
    respiration: 16,
    spo2: 97,
  },
  Night: {
    systolic: 115,
    diastolic: 73,
    heartRate: 68,
    temperature: 36.5,
    respiration: 15,
    spo2: 97,
  },
} as const;

const THRESH = {
  systolic: { warnLow: 90, dangerLow: 80, warnHigh: 140, dangerHigh: 160 },
  diastolic: { warnLow: 60, dangerLow: 50, warnHigh: 90, dangerHigh: 100 },
  heartRate: { warnLow: 50, dangerLow: 40, warnHigh: 100, dangerHigh: 130 },
  temperature: { warnLow: 35, dangerLow: 34, warnHigh: 37.5, dangerHigh: 39 },
  respiration: { warnLow: 12, dangerLow: 8, warnHigh: 20, dangerHigh: 30 },
  spo2: { warnLow: 90, dangerLow: 90 }, // <95 normal, 90-94 warn, <90 danger
};

function getShiftFromDate(d: Date) {
  const h = d.getHours();
  // Morning 06:00 - 13:59, Afternoon 14:00 - 21:59, Night 22:00 - 05:59
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Afternoon";
  return "Night";
}

function toLocalInputValue(date: Date) {
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 19);
}
function parseLocalInputValue(val: string) {
  return new Date(val);
}
function fmtHeader(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds()
  )} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/* -------------------- zod schema -------------------- */
const vitalSchema = z.object({
  residentName: z.string().min(1, "Resident name is required"),
  measuredAt: z
    .string()
    .refine((s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime());
    }, "Invalid time")
    .refine(
      (s) => new Date(s) <= new Date(),
      "Measurement time cannot be in the future"
    ),
  systolic: z.coerce.number().int().min(0, "Enter a valid value"),
  diastolic: z.coerce.number().int().min(0, "Enter a valid value"),
  heartRate: z.coerce.number().int().min(0, "Enter a valid value"),
  temperature: z.coerce.number().min(0, "Enter a valid value"),
  respiration: z.coerce.number().int().min(0, "Enter a valid value"),
  spo2: z.coerce.number().int().min(0, "Enter a valid value"),
  note: z.string().max(1000).optional(),
});
type VitalValues = z.infer<typeof vitalSchema>;

/* -------------------- level functions -------------------- */
const lvl = {
  systolic: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v <= THRESH.systolic.dangerLow) return "danger";
    if (v < THRESH.systolic.warnLow) return "warn";
    if (v >= THRESH.systolic.dangerHigh) return "danger";
    if (v >= THRESH.systolic.warnHigh) return "warn";
    return "normal";
  },
  diastolic: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v <= THRESH.diastolic.dangerLow) return "danger";
    if (v < THRESH.diastolic.warnLow) return "warn";
    if (v >= THRESH.diastolic.dangerHigh) return "danger";
    if (v >= THRESH.diastolic.warnHigh) return "warn";
    return "normal";
  },
  heartRate: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v <= THRESH.heartRate.dangerLow) return "danger";
    if (v < THRESH.heartRate.warnLow) return "warn";
    if (v >= THRESH.heartRate.dangerHigh) return "danger";
    if (v >= THRESH.heartRate.warnHigh) return "warn";
    return "normal";
  },
  temperature: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v <= THRESH.temperature.dangerLow) return "danger";
    if (v < THRESH.temperature.warnLow) return "warn";
    if (v >= THRESH.temperature.dangerHigh) return "danger";
    if (v >= THRESH.temperature.warnHigh) return "warn";
    return "normal";
  },
  respiration: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v <= THRESH.respiration.dangerLow) return "danger";
    if (v < THRESH.respiration.warnLow) return "warn";
    if (v >= THRESH.respiration.dangerHigh) return "danger";
    if (v >= THRESH.respiration.warnHigh) return "warn";
    return "normal";
  },
  spo2: (v?: number): Level => {
    if (!v && v !== 0) return "normal";
    if (v < THRESH.spo2.dangerLow) return "danger";
    if (v < THRESH.spo2.warnLow) return "warn";
    return "normal";
  },
};

/* -------------------- small UI helpers -------------------- */
const borderFor = (l: Level) =>
  l === "danger"
    ? "border-red-500 ring-red-50"
    : l === "warn"
    ? "border-amber-400 ring-amber-50"
    : "border-gray-200";

export default function VitalSignForm() {
  // realtime clock
  const [now, setNow] = useState<Date>(new Date());
  const navigate = useNavigate();
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // toast notification
  const [toastMsg, setToastMsg] = useState<{
    text: string;
    color?: string;
  } | null>(null);

  // Fetch residents and rooms
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [showResidentList, setShowResidentList] = useState(true);
  const summaryQuery = useHealthSummary(selectedResidentId);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(
    null
  );
  const [correctionReason, setCorrectionReason] = useState("");
  const [careLogCorrection, setCareLogCorrection] = useState<{
    care_log_id: string;
    status: "pending" | "in_progress" | "completed";
    notes?: string | null;
  } | null>(null);
  const [careLogReason, setCareLogReason] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [residentsRes, roomsRes] = await Promise.all([
          getResidents(),
          getRooms(), // Lấy từ token, không cần institutionId
        ]);
        setResidents(residentsRes.residents || []);
        setRooms(roomsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setEditingAssessmentId(null);
    setCorrectionReason("");
    setCareLogCorrection(null);
    setCareLogReason("");
  }, [selectedResidentId]);

  // Filter residents by room
  const filteredResidents = useMemo(() => {
    if (selectedRoomFilter === "all") return residents;
    if (selectedRoomFilter === "no-room")
      return residents.filter((r) => !r.room_id);
    return residents.filter((r) => r.room_id === selectedRoomFilter);
  }, [residents, selectedRoomFilter]);

  const { register, handleSubmit, watch, reset, setValue, trigger, formState } =
    useForm<VitalValues>({
      resolver: zodResolver(vitalSchema) as any,
      mode: "onChange",
      defaultValues: {
        residentName: "",
        measuredAt: toLocalInputValue(new Date()),
        ...PRESET.Morning,
        note: "",
      },
    });

  // watch fields
  const values = watch();

  // Auto-set residentName when resident is selected (after form is initialized)
  useEffect(() => {
    if (selectedResidentId && residents.length > 0) {
      const resident = residents.find(
        (r) => r.resident_id === selectedResidentId
      );
      if (resident) {
        setValue("residentName", resident.full_name);
        trigger("residentName");
      }
    } else if (!selectedResidentId) {
      setValue("residentName", "");
      trigger("residentName");
    }
  }, [selectedResidentId, residents, setValue, trigger]);

  // computed levels
  const levels = useMemo(
    () => ({
      systolic: lvl.systolic(values.systolic),
      diastolic: lvl.diastolic(values.diastolic),
      heartRate: lvl.heartRate(values.heartRate),
      temperature: lvl.temperature(values.temperature),
      respiration: lvl.respiration(values.respiration),
      spo2: lvl.spo2(values.spo2),
    }),
    [
      values.systolic,
      values.diastolic,
      values.heartRate,
      values.temperature,
      values.respiration,
      values.spo2,
    ]
  );

  // measuredAt warnings: future is blocked by zod; older than 24h -> show warning
  const measuredDate = useMemo(() => {
    try {
      return parseLocalInputValue(values.measuredAt);
    } catch {
      return null;
    }
  }, [values.measuredAt]);

  const measuredAgeMs = measuredDate
    ? Date.now() - measuredDate.getTime()
    : null;
  const measuredOlderThan24h =
    measuredAgeMs != null && measuredAgeMs > 24 * 3600 * 1000;

  // summary danger/warning flags
  const anyDanger = Object.values(levels).some((l) => l === "danger");
  const anyWarn = Object.values(levels).some((l) => l === "warn");

  // submit handler
  const onSubmit: SubmitHandler<VitalValues> = async (data) => {
    if (!selectedResidentId) {
      toast.error("Vui lòng chọn cư dân");
      return;
    }

    const payload = {
      weight_kg: undefined,
      height_cm: undefined,
      bmi: undefined,
      temperature_c: data.temperature,
      blood_pressure_systolic: data.systolic,
      blood_pressure_diastolic: data.diastolic,
      heart_rate: data.heartRate,
      respiratory_rate: data.respiration,
      oxygen_saturation: data.spo2,
      notes: data.note || undefined,
      measured_at: data.measuredAt,
    };

    try {
      if (editingAssessmentId) {
        if (!correctionReason.trim()) {
          toast.error("Vui lòng cung cấp ghi chú chỉnh sửa cho nhật ký kiểm toán.");
          return;
        }
        await updateAssessment(editingAssessmentId, {
          ...payload,
          correction_reason: correctionReason.trim(),
        });
        toast.success("Đánh giá đã được chỉnh sửa thành công.", {
          autoClose: 2500,
        });
      } else {
        await createAssessment(selectedResidentId, payload);
        if (anyDanger) {
          toast.warning(
            "Lưu thành công nhưng phát hiện giá trị NGUY HIỂM — thông báo bác sĩ.",
            { autoClose: 3000 }
          );
        } else if (anyWarn) {
          toast.warning("Lưu thành công. Một số giá trị ở mức cảnh báo.", {
            autoClose: 3000,
          });
        } else {
          toast.success("Đã lưu chỉ số sinh tồn thành công.", { autoClose: 2500 });
        }
      }

      summaryQuery.refetch();
      reset({
        measuredAt: toLocalInputValue(new Date()),
        ...PRESET.Morning,
        note: "",
      });
      setEditingAssessmentId(null);
      setCorrectionReason("");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.message || "Lỗi khi lưu, vui lòng thử lại.",
        { autoClose: 3000 }
      );
    }
  };

  // helper message for each field
  const msgFor = (field: keyof typeof levels, level: Level) => {
    const v = (values as any)[field];
    if (v == null || v === "") return null;
    if (level === "normal") return null;
    if (level === "warn") {
      switch (field) {
        case "systolic":
          return "Huyết áp tâm thu hơi bất thường — theo dõi.";
        case "diastolic":
          return "Huyết áp tâm trương hơi bất thường — theo dõi.";
        case "heartRate":
          return "Nhịp tim ngoài phạm vi bình thường — theo dõi.";
        case "temperature":
          return "Nhiệt độ hơi bất thường — theo dõi.";
        case "respiration":
          return "Nhịp thở hơi bất thường — theo dõi.";
        case "spo2":
          return "SpO₂ hơi thấp — theo dõi.";
        default:
          return null;
      }
    } else {
      switch (field) {
        case "systolic":
          return "Huyết áp tâm thu cực kỳ bất thường — cần chú ý ngay!";
        case "diastolic":
          return "Huyết áp tâm trương cực kỳ bất thường — cần chú ý ngay!";
        case "heartRate":
          return "Nhịp tim nguy hiểm — cần chú ý ngay!";
        case "temperature":
          return "Nhiệt độ cơ thể nguy hiểm — cần chú ý ngay!";
        case "respiration":
          return "Nhịp thở nguy hiểm — cần chú ý ngay!";
        case "spo2":
          return "SpO₂ cực kỳ thấp — cần chú ý ngay!";
        default:
          return null;
      }
    }
  };

  const handleLoadAssessmentForCorrection = (
    assessment: AssessmentResponse
  ) => {
    const timestamp = assessment.measured_at || assessment.created_at;
    if (timestamp) {
      setValue("measuredAt", toLocalInputValue(new Date(timestamp)));
    }
    setValue("systolic", assessment.blood_pressure_systolic ?? 0);
    setValue("diastolic", assessment.blood_pressure_diastolic ?? 0);
    setValue("heartRate", assessment.heart_rate ?? 0);
    setValue("temperature", assessment.temperature_c ?? 0);
    setValue("respiration", assessment.respiratory_rate ?? 0);
    setValue("spo2", assessment.oxygen_saturation ?? 0);
    setValue("note", assessment.notes || undefined);
    setEditingAssessmentId(assessment.assessment_id);
    setCorrectionReason("");
  };

  const formatSummaryTime = (value?: string | Date) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const handleCareLogCorrectionSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!careLogCorrection) return;
    if (!careLogReason.trim()) {
      toast.error("Vui lòng cung cấp lý do chỉnh sửa cho nhật ký chăm sóc.");
      return;
    }
    try {
      await updateCareLog(careLogCorrection.care_log_id, {
        status: careLogCorrection.status,
        notes: careLogCorrection.notes || undefined,
        correction_reason: careLogReason.trim(),
      });
      toast.success("Nhật ký chăm sóc đã được cập nhật thành công.", { autoClose: 2500 });
      setCareLogCorrection(null);
      setCareLogReason("");
      summaryQuery.refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Không thể chỉnh sửa nhật ký chăm sóc lúc này."
      );
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden flex gap-4">
        {/* Left sidebar - Resident list */}
        {showResidentList && (
          <div className="w-80 flex-shrink-0 bg-white rounded-3xl ring-1 ring-gray-200 shadow-lg overflow-hidden flex flex-col">
            <div className="px-4 py-4 border-b border-gray-200 bg-white/95">
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: PRIMARY }}
              >
                Chọn Cư dân
              </h3>
              {/* Room filter */}
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Lọc theo Phòng
                </label>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border border-gray-200 bg-white text-sm"
                >
                  <option value="all">Tất cả Phòng</option>
                  <option value="no-room">Chưa phân công phòng</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      Phòng {room.room_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">
                {filteredResidents.length} cư dân
              </div>
            </div>
            {/* Resident list */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredResidents.map((resident) => (
                <Card
                  key={resident.resident_id}
                  className={`mb-2 cursor-pointer transition-all ${
                    selectedResidentId === resident.resident_id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={async () => {
                    setSelectedResidentId(resident.resident_id);
                    setValue("residentName", resident.full_name);
                    await trigger("residentName");
                  }}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-sm">
                      {resident.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {resident.gender} •{" "}
                      {new Date().getFullYear() -
                        new Date(resident.date_of_birth).getFullYear()}{" "}
                      tuổi
                    </div>
                    {resident.room_id && (
                      <div className="text-xs text-blue-600 mt-1">
                        Phòng:{" "}
                        {rooms.find((r) => r.room_id === resident.room_id)
                          ?.room_number || resident.room_id}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredResidents.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  Không tìm thấy cư dân
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workspace */}
        <div className="flex-1 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0 bg-white rounded-3xl ring-1 ring-gray-200 shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
                    Nhập Chỉ số Sinh tồn
                  </h1>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowResidentList(!showResidentList)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 mb-2"
                  >
                    {showResidentList ? "Ẩn" : "Hiện"} Danh sách
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    {fmtHeader(now)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-4"
              >
                {editingAssessmentId && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                    <div className="flex items-center justify-between gap-2">
                      <p>
                        Đang chỉnh sửa đánh giá #{editingAssessmentId.slice(0, 8)} —
                        vui lòng cung cấp lý do chỉnh sửa cho nhật ký kiểm toán.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssessmentId(null);
                          setCorrectionReason("");
                          reset();
                        }}
                        className="text-xs text-amber-700 underline"
                      >
                        Hủy
                      </button>
                    </div>
                    <textarea
                      value={correctionReason}
                      onChange={(event) =>
                        setCorrectionReason(event.target.value)
                      }
                      rows={2}
                      placeholder="Tại sao bạn chỉnh sửa phép đo này?"
                      className="mt-3 w-full rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-left">
                  <div>
                    <label className="text-sm font-medium">
                      Tên Cư dân *
                    </label>
                    <input
                      {...register("residentName")}
                      type="text"
                      disabled
                      placeholder={
                        showResidentList
                          ? "← Chọn từ danh sách"
                          : "Chọn cư dân"
                      }
                      className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200 bg-gray-50 text-gray-700"
                    />
                    <div className="text-xs mt-1 text-gray-500">
                      {formState.errors.residentName && (
                        <span className="text-red-600">
                          {String(formState.errors.residentName.message)}
                        </span>
                      )}
                      {!selectedResidentId &&
                        !formState.errors.residentName && (
                          <span className="text-blue-600">
                            {showResidentList
                              ? "Chọn cư dân từ danh sách"
                              : "Nhấn 'Hiện Danh sách' để chọn cư dân"}
                          </span>
                        )}
                    </div>
                  </div>

                  {selectedResidentId && (
                    <div>
                      <label className="text-sm font-medium">Thông tin Phòng</label>
                      <div className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200 bg-gray-50 text-gray-700">
                        {(() => {
                          const resident = residents.find(
                            (r) => r.resident_id === selectedResidentId
                          );
                          if (!resident?.room_id) return "Chưa phân công phòng";
                          const room = rooms.find(
                            (r) => r.room_id === resident.room_id
                          );
                          return room
                            ? `Phòng ${room.room_number}`
                            : "Phòng không xác định";
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-left">
                  <div>
                    <label className="text-sm font-medium">
                      Thời gian Đo
                    </label>
                    <input
                      {...register("measuredAt")}
                      type="datetime-local"
                      step={1}
                      className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
                    />
                    <div className="text-xs mt-1 text-gray-500">
                      {formState.errors.measuredAt ? (
                        <span className="text-red-600">
                          {String(formState.errors.measuredAt.message)}
                        </span>
                      ) : measuredOlderThan24h ? (
                        <span className="text-amber-700">
                          Thời gian đo đã hơn 24 giờ — vui lòng xác minh cẩn thận.
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setValue("measuredAt", toLocalInputValue(new Date()));
                        setToastMsg({
                          text: "Thời gian đo đã được đặt về hiện tại.",
                          color: PRIMARY,
                        });
                        setTimeout(() => setToastMsg(null), 1800);
                      }}
                      className="px-3 py-2 rounded-lg border"
                    >
                      Đặt Thời gian Hiện tại
                    </button>
                  </div>
                </div>

                {/* input fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div>
                    <label className="text-sm font-medium">
                      Huyết áp Tâm thu
                    </label>
                    <input
                      {...register("systolic")}
                      type="text"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.systolic
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.systolic === "danger"
                          ? "text-red-600"
                          : levels.systolic === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("systolic", levels.systolic) ||
                        (formState.errors.systolic
                          ? String(formState.errors.systolic.message)
                          : null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Huyết áp Tâm trương
                    </label>
                    <input
                      {...register("diastolic")}
                      type="text"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.diastolic
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.diastolic === "danger"
                          ? "text-red-600"
                          : levels.diastolic === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("diastolic", levels.diastolic) ||
                        (formState.errors.diastolic
                          ? String(formState.errors.diastolic.message)
                          : null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Nhịp tim (bpm)
                    </label>
                    <input
                      {...register("heartRate")}
                      type="text"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.heartRate
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.heartRate === "danger"
                          ? "text-red-600"
                          : levels.heartRate === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("heartRate", levels.heartRate) ||
                        (formState.errors.heartRate
                          ? String(formState.errors.heartRate.message)
                          : null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Nhiệt độ (°C)
                    </label>
                    <input
                      {...register("temperature")}
                      type="text"
                      step="0.1"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.temperature
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.temperature === "danger"
                          ? "text-red-600"
                          : levels.temperature === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("temperature", levels.temperature) ||
                        (formState.errors.temperature
                          ? String(formState.errors.temperature.message)
                          : null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Nhịp thở (lần/phút)
                    </label>
                    <input
                      {...register("respiration")}
                      type="text"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.respiration
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.respiration === "danger"
                          ? "text-red-600"
                          : levels.respiration === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("respiration", levels.respiration) ||
                        (formState.errors.respiration
                          ? String(formState.errors.respiration.message)
                          : null)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">SpO₂ (%)</label>
                    <input
                      {...register("spo2")}
                      type="text"
                      className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(
                        levels.spo2
                      )}`}
                    />
                    <div
                      className={`text-xs mt-1 ${
                        levels.spo2 === "danger"
                          ? "text-red-600"
                          : levels.spo2 === "warn"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}
                    >
                      {msgFor("spo2", levels.spo2) ||
                        (formState.errors.spo2
                          ? String(formState.errors.spo2.message)
                          : null)}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm font-medium">Ghi chú</label>
                    <textarea
                      {...register("note")}
                      rows={3}
                      className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
                    />
                  </div>
                </div>

                {/* summary & actions */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={
                      Object.keys(formState.errors).length > 0 ||
                      formState.isSubmitting
                    }
                    className={`px-5 py-2 rounded-lg text-white ${
                      Object.keys(formState.errors).length > 0 ||
                      formState.isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    style={{ background: PRIMARY }}
                  >
                    {formState.isSubmitting
                      ? "Đang lưu..."
                      : editingAssessmentId
                      ? "Cập nhật đánh giá"
                      : "💾 Lưu"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      reset({
                        measuredAt: toLocalInputValue(new Date()),
                        ...PRESET.Morning,
                        note: "",
                      })
                    }
                    className="px-4 py-2 rounded-lg border border-[#5985D8] text-[#5985D8]"
                  >
                    <RefreshCw size={16} className="inline-block mr-2" />
                    Đặt lại Biểu mẫu
                  </button>

                  <div className="ml-auto text-xs text-gray-500">
                    {anyDanger
                      ? "Phát hiện giá trị nguy hiểm"
                      : anyWarn
                      ? "Một số giá trị cần theo dõi"
                      : "Tất cả giá trị trong phạm vi bình thường"}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-4">
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Mô-đun Tính toán</CardTitle>
                <p className="text-xs text-gray-500">
                  Phiên bản {summaryQuery.data?.meta.engine_version ?? "—"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryQuery.isLoading && (
                  <p className="text-sm text-gray-500">Đang tải tín hiệu...</p>
                )}
                {!summaryQuery.isLoading &&
                  summaryQuery.data?.indicators.map((indicator) => (
                    <div
                      key={indicator.id}
                      className="rounded-xl border border-gray-100 bg-slate-50 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">
                            {indicator.label}
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {indicator.value}
                            {indicator.unit && (
                              <span className="ml-1 text-sm text-gray-500">
                                {indicator.unit}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`border ${
                            severityColors[indicator.severity]
                          }`}
                        >
                          {indicator.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        {indicator.description}
                      </p>
                    </div>
                  ))}
                {!summaryQuery.isLoading &&
                  !summaryQuery.data?.indicators.length && (
                    <p className="text-sm text-gray-500">
                      Chọn cư dân để xem thông tin tự động.
                    </p>
                  )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Đo lường Gần đây</CardTitle>
                <p className="text-xs text-gray-500">
                  Tải dữ liệu để chỉnh sửa nếu cần
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryQuery.data?.vitals.history.length ? (
                  summaryQuery.data.vitals.history
                    .slice(0, 5)
                    .map((assessment) => (
                      <div
                        key={assessment.assessment_id}
                        className="rounded-xl border border-gray-100 bg-slate-50 p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                          <span>
                            {formatSummaryTime(
                              assessment.measured_at || assessment.created_at
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleLoadAssessmentForCorrection(assessment)
                            }
                            className="text-xs text-blue-600 underline"
                          >
                            Tải
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                          HA: {assessment.blood_pressure_systolic ?? "—"}/
                          {assessment.blood_pressure_diastolic ?? "—"} mmHg •
                          NT: {assessment.heart_rate ?? "—"} bpm • SpO₂:{" "}
                          {assessment.oxygen_saturation ?? "—"}%
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có đo lường lịch sử.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Chỉnh sửa Nhật ký Chăm sóc</CardTitle>
                <p className="text-xs text-gray-500">
                  Đảm bảo hoạt động cung cấp dữ liệu chính xác cho hệ thống
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaryQuery.data?.careLogs.recent.length ? (
                  summaryQuery.data.careLogs.recent.slice(0, 4).map((log) => (
                    <div
                      key={log.care_log_id}
                      className="rounded-xl border border-gray-100 bg-slate-50 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                        <span>{log.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setCareLogCorrection({
                              care_log_id: log.care_log_id,
                              status: log.status as
                                | "pending"
                                | "in_progress"
                                | "completed",
                              notes: log.notes,
                            })
                          }
                          className="text-xs text-blue-600 underline"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatSummaryTime(log.start_time)}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Không tìm thấy nhật ký chăm sóc cho cư dân này.
                  </p>
                )}

                {careLogCorrection && (
                  <form
                    onSubmit={handleCareLogCorrectionSubmit}
                    className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 shadow-sm"
                  >
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Trạng thái
                      </label>
                      <select
                        value={careLogCorrection.status}
                        onChange={(event) =>
                          setCareLogCorrection((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status: event.target
                                    .value as (typeof careLogCorrection)["status"],
                                }
                              : prev
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="pending">Đang chờ</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="completed">Đã hoàn thành</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Ghi chú
                      </label>
                      <textarea
                        value={careLogCorrection.notes ?? ""}
                        onChange={(event) =>
                          setCareLogCorrection((prev) =>
                            prev ? { ...prev, notes: event.target.value } : prev
                          )
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">
                        Lý do chỉnh sửa
                      </label>
                      <textarea
                        value={careLogReason}
                        onChange={(event) =>
                          setCareLogReason(event.target.value)
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        placeholder="Giải thích tại sao nhật ký chăm sóc này cần chỉnh sửa"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-[#5985D8] px-3 py-2 text-sm font-medium text-white"
                      >
                        Lưu chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCareLogCorrection(null);
                          setCareLogReason("");
                        }}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* toast */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-white shadow-md"
          style={{ background: toastMsg.color || PRIMARY }}
        >
          {toastMsg.text}
        </div>
      )}
    </div>
  );
}
