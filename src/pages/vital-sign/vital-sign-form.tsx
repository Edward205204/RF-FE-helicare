import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createAssessment } from "@/apis/assessment.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";

type Level = "normal" | "warn" | "danger";

const PRIMARY = "#5985D8";
const BG =
  "radial-gradient(120% 120% at 0% 100%, #dfe9ff 0%, #ffffff 45%, #efd8d3 100%)";

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
  measurementBy: z.string().min(1, "Staff name is required"),
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
  shift: z.enum(["Morning", "Afternoon", "Night"]),
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [residentsRes, roomsRes] = await Promise.all([
          getResidents(),
          getRooms(), // Lấy từ token, không cần institutionId
        ]);
        setResidents(residentsRes.data || []);
        setRooms(roomsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Filter residents by room
  const filteredResidents = useMemo(() => {
    if (selectedRoomFilter === "all") return residents;
    if (selectedRoomFilter === "no-room")
      return residents.filter((r) => !r.room_id);
    return residents.filter((r) => r.room_id === selectedRoomFilter);
  }, [residents, selectedRoomFilter]);

  const { register, handleSubmit, watch, reset, setValue, formState } =
    useForm<VitalValues>({
      resolver: zodResolver(vitalSchema) as any,
      mode: "onChange",
      defaultValues: {
        measuredAt: toLocalInputValue(new Date()),
        ...PRESET.Morning,
        shift: getShiftFromDate(new Date()),
        note: "",
      },
    });

  // watch fields
  const values = watch();

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

  // auto-assign shift from measuredAt, unless user manually overrides
  const [overrideShift, setOverrideShift] = useState(false);
  useEffect(() => {
    if (!overrideShift) {
      try {
        const d = parseLocalInputValue(values.measuredAt);
        const s = getShiftFromDate(d);
        setValue("shift", s);
      } catch {
        // ignore parse errors
      }
    }
  }, [values.measuredAt]);

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
      toast.error("Please select a resident");
      return;
    }

    try {
      console.log("Saving vitals (hospital mode):", data);

      // Prepare assessment data for API
      const assessmentData = {
        weight_kg: undefined, // Not in current form
        height_cm: undefined, // Not in current form
        bmi: undefined, // Not in current form
        temperature_c: data.temperature,
        blood_pressure_systolic: data.systolic,
        blood_pressure_diastolic: data.diastolic,
        heart_rate: data.heartRate,
        respiratory_rate: data.respiration,
        oxygen_saturation: data.spo2,
        notes: data.note || undefined,
      };

      // Call API to create assessment
      await createAssessment(selectedResidentId, assessmentData);

      if (anyDanger) {
        toast.warning(
          "Saved successfully but CRITICAL values detected — notify doctor.",
          { autoClose: 3000 }
        );
      } else if (anyWarn) {
        toast.warning("Saved successfully. Some values are borderline.", {
          autoClose: 3000,
        });
      } else {
        toast.success("Vital signs saved successfully.", { autoClose: 2500 });
      }

      // Reset form after successful save
      reset();
      setSelectedResidentId("");
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.message || "Error while saving, please try again.",
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
          return "Systolic BP slightly abnormal — monitor.";
        case "diastolic":
          return "Diastolic BP slightly abnormal — monitor.";
        case "heartRate":
          return "Heart rate outside normal range — monitor.";
        case "temperature":
          return "Temperature slightly abnormal — monitor.";
        case "respiration":
          return "Respiration rate slightly abnormal — monitor.";
        case "spo2":
          return "SpO₂ slightly low — monitor.";
        default:
          return null;
      }
    } else {
      switch (field) {
        case "systolic":
          return "Extremely abnormal systolic BP — urgent attention!";
        case "diastolic":
          return "Extremely abnormal diastolic BP — urgent attention!";
        case "heartRate":
          return "Dangerous heart rate — urgent attention!";
        case "temperature":
          return "Dangerous body temperature — urgent attention!";
        case "respiration":
          return "Dangerous respiration rate — urgent attention!";
        case "spo2":
          return "Critically low SpO₂ — urgent attention!";
        default:
          return null;
      }
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
                Select Resident
              </h3>
              {/* Room filter */}
              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Filter className="inline h-4 w-4 mr-1" />
                  Filter by Room
                </label>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border border-gray-200 bg-white text-sm"
                >
                  <option value="all">All Rooms</option>
                  <option value="no-room">No Room Assigned</option>
                  {rooms.map((room) => (
                    <option key={room.room_id} value={room.room_id}>
                      Room {room.room_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-500">
                {filteredResidents.length} resident(s)
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
                  onClick={() => {
                    setSelectedResidentId(resident.resident_id);
                    setValue("residentName", resident.full_name);
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
                      years
                    </div>
                    {resident.room_id && (
                      <div className="text-xs text-blue-600 mt-1">
                        Room:{" "}
                        {rooms.find((r) => r.room_id === resident.room_id)
                          ?.room_number || resident.room_id}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredResidents.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No residents found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main form */}
        <div className="flex-1 min-w-0 bg-white rounded-3xl ring-1 ring-gray-200 shadow-lg overflow-hidden flex flex-col">
          {/* header */}
          <div className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
                  Enter Vital Signs
                </h1>
                {/* <p className="text-sm text-gray-500">Make sure to enter the actual measurement time</p> */}
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowResidentList(!showResidentList)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 mb-2"
                >
                  {showResidentList ? "Hide" : "Show"} List
                </button>
                <div className="text-sm">
                  Current Shift:{" "}
                  <span
                    className="px-2 py-1 rounded"
                    style={{ background: "#eef4ff", color: PRIMARY }}
                  >
                    {getShiftFromDate(now)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {fmtHeader(now)}
                </div>
              </div>
            </div>
          </div>

          {/* form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-left">
                <div>
                  <label className="text-sm font-medium">Resident Name *</label>
                  <input
                    {...register("residentName")}
                    type="text"
                    disabled
                    placeholder={
                      showResidentList
                        ? "← Select from list"
                        : "Select a resident"
                    }
                    className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200 bg-gray-50 text-gray-700"
                  />
                  <div className="text-xs mt-1 text-gray-500">
                    {formState.errors.residentName && (
                      <span className="text-red-600">
                        {String(formState.errors.residentName.message)}
                      </span>
                    )}
                    {!selectedResidentId && !formState.errors.residentName && (
                      <span className="text-blue-600">
                        {showResidentList
                          ? "Select a resident from the list"
                          : "Click 'Show List' to select a resident"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Measurement By (Staff Name)
                  </label>
                  <input
                    {...register("measurementBy")}
                    type="text"
                    className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
                  />
                  <div className="text-xs mt-1 text-gray-500">
                    {formState.errors.measurementBy && (
                      <span className="text-red-600">
                        {String(formState.errors.measurementBy.message)}
                      </span>
                    )}
                  </div>
                </div>

                {selectedResidentId && (
                  <div>
                    <label className="text-sm font-medium">Room Info</label>
                    <div className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200 bg-gray-50 text-gray-700">
                      {(() => {
                        const resident = residents.find(
                          (r) => r.resident_id === selectedResidentId
                        );
                        if (!resident?.room_id) return "No room assigned";
                        const room = rooms.find(
                          (r) => r.room_id === resident.room_id
                        );
                        return room
                          ? `Room ${room.room_number}`
                          : "Unknown room";
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end text-left">
                <div>
                  <label className="text-sm font-medium">
                    Measurement Time
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
                        Measurement time is more than 24 hours old — verify
                        carefully.
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Shift (auto from measurement time)
                  </label>
                  <select
                    {...register("shift")}
                    className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
                    onChange={(e) => {
                      setValue(
                        "shift",
                        e.target.value as "Morning" | "Afternoon" | "Night"
                      );
                      setOverrideShift(true);
                    }}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                  <div className="text-xs mt-1">
                    {!formState.errors.measuredAt && measuredDate ? (
                      getShiftFromDate(measuredDate) !==
                      (values.shift as string) ? (
                        <span className="text-amber-700">
                          Shift manually overridden and does not match
                          measurement time ({getShiftFromDate(measuredDate)}).
                        </span>
                      ) : null
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setValue("measuredAt", toLocalInputValue(new Date()));
                      if (!overrideShift) {
                        setValue("shift", getShiftFromDate(new Date()));
                      }
                      setToastMsg({
                        text: "Measurement time reset to now.",
                        color: PRIMARY,
                      });
                      setTimeout(() => setToastMsg(null), 1800);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  >
                    Set Current Time
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOverrideShift(false);
                      setToastMsg({
                        text: "Auto shift assignment enabled.",
                        color: PRIMARY,
                      });
                      setTimeout(() => setToastMsg(null), 1500);
                    }}
                    className="px-3 py-2 rounded-lg border"
                  >
                    Auto-assign Shift
                  </button>
                </div>
              </div>

              {/* input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div>
                  <label className="text-sm font-medium">
                    Systolic Blood Pressure
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
                    Diastolic Blood Pressure
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
                    Heart Rate (bpm)
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
                    Temperature (°C)
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
                    Respiration Rate (per min)
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
                  <label className="text-sm font-medium">Note</label>
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
                  {formState.isSubmitting ? "Saving..." : "💾 Save"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    reset({
                      measuredAt: toLocalInputValue(new Date()),
                      ...PRESET.Morning,
                      shift: getShiftFromDate(new Date()),
                      note: "",
                    })
                  }
                  className="px-4 py-2 rounded-lg border border-[#5985D8] text-[#5985D8]"
                >
                  <RefreshCw size={16} className="inline-block mr-2" />
                  Reset Form
                </button>

                <div className="ml-auto text-xs text-gray-500">
                  {anyDanger
                    ? "Critical values detected"
                    : anyWarn
                    ? "Some values need monitoring"
                    : "All values within range"}
                </div>
              </div>
            </form>
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
