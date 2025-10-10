// npm install react-hook-form zod @hookform/resolvers
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";

/* -------------------- Thresholds & helpers -------------------- */
type Level = "normal" | "warn" | "danger";

const PRIMARY = "#5985D8";
const BG = "#F4F6FB";

const PRESET = {
  Morning: { systolic: 120, diastolic: 75, heartRate: 72, temperature: 36.6, respiration: 16, spo2: 97 },
  Afternoon: { systolic: 118, diastolic: 74, heartRate: 70, temperature: 36.6, respiration: 16, spo2: 97 },
  Night: { systolic: 115, diastolic: 73, heartRate: 68, temperature: 36.5, respiration: 15, spo2: 97 },
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
  // convert to local ISO without timezone offset, include seconds: YYYY-MM-DDTHH:MM:SS
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 19);
}
function parseLocalInputValue(val: string) {
  // input like "2025-09-27T00:51:06"
  return new Date(val);
}
function fmtHeader(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(
    d.getMonth() + 1
  )}/${d.getFullYear()}`;
}

/* -------------------- zod schema -------------------- */
const vitalSchema = z.object({
  measuredAt: z
    .string()
    .refine((s) => {
      const d = new Date(s);
      return !Number.isNaN(d.getTime());
    }, "Invalid time")
    .refine((s) => new Date(s) <= new Date(), "Measurement time cannot be in the future"),
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
  l === "danger" ? "border-red-500 ring-red-50" : l === "warn" ? "border-amber-400 ring-amber-50" : "border-gray-200";

/* -------------------- Component -------------------- */
export default function VitalInputFormHospital() {
  // realtime clock
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // toast notification
  const [toast, setToast] = useState<{ text: string; color?: string } | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState } = useForm<VitalValues>({
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
    [values.systolic, values.diastolic, values.heartRate, values.temperature, values.respiration, values.spo2]
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

  const measuredAgeMs = measuredDate ? Date.now() - measuredDate.getTime() : null;
  const measuredOlderThan24h = measuredAgeMs != null && measuredAgeMs > 24 * 3600 * 1000;

  // summary danger/warning flags
  const anyDanger = Object.values(levels).some((l) => l === "danger");
  const anyWarn = Object.values(levels).some((l) => l === "warn");

  // submit handler
  const onSubmit: SubmitHandler<VitalValues> = async (data) => {
    try {
      console.log("Saving vitals (hospital mode):", data);
      if (anyDanger) {
        setToast({ text: "⚠️ Saved successfully but CRITICAL values detected — notify doctor.", color: "#dc2626" });
      } else if (anyWarn) {
        setToast({ text: "⚠️ Saved successfully. Some values are borderline.", color: "#f59e0b" });
      } else {
        setToast({ text: "✅ Vital signs saved successfully.", color: PRIMARY });
      }
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      console.error(e);
      setToast({ text: "❌ Error while saving, please try again.", color: "#dc2626" });
      setTimeout(() => setToast(null), 2500);
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
          return "⚠️ Systolic BP slightly abnormal — monitor.";
        case "diastolic":
          return "⚠️ Diastolic BP slightly abnormal — monitor.";
        case "heartRate":
          return "⚠️ Heart rate outside normal range — monitor.";
        case "temperature":
          return "⚠️ Temperature slightly abnormal — monitor.";
        case "respiration":
          return "⚠️ Respiration rate slightly abnormal — monitor.";
        case "spo2":
          return "⚠️ SpO₂ slightly low — monitor.";
        default:
          return null;
      }
    } else {
      switch (field) {
        case "systolic":
          return "🚨 Extremely abnormal systolic BP — urgent attention!";
        case "diastolic":
          return "🚨 Extremely abnormal diastolic BP — urgent attention!";
        case "heartRate":
          return "🚨 Dangerous heart rate — urgent attention!";
        case "temperature":
          return "🚨 Dangerous body temperature — urgent attention!";
        case "respiration":
          return "🚨 Dangerous respiration rate — urgent attention!";
        case "spo2":
          return "🚨 Critically low SpO₂ — urgent attention!";
        default:
          return null;
      }
    }
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen p-6" style={{ background: BG }}>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 shadow-lg">
        {/* header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: PRIMARY }}>
              Enter Vital Signs
            </h1>
            <p className="text-sm text-gray-500">Make sure to enter the actual measurement time</p>
          </div>
          <div className="text-right">
            <div className="text-sm">
              Current Shift:{" "}
              <span className="px-2 py-1 rounded" style={{ background: "#eef4ff", color: PRIMARY }}>
                {getShiftFromDate(now)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{fmtHeader(now)}</div>
          </div>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-sm font-medium">Measurement Time</label>
              <input
                {...register("measuredAt")}
                type="datetime-local"
                step={1}
                className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
              />
              <div className="text-xs mt-1 text-gray-500">
                {formState.errors.measuredAt ? (
                  <span className="text-red-600">{String(formState.errors.measuredAt.message)}</span>
                ) : measuredOlderThan24h ? (
                  <span className="text-amber-700">⚠️ Measurement time is more than 24 hours old — verify carefully.</span>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Shift (auto from measurement time)</label>
              <select
                {...register("shift")}
                className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200"
                onChange={(e) => {
                  setValue("shift", e.target.value as "Morning" | "Afternoon" | "Night");
                  setOverrideShift(true);
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
              <div className="text-xs mt-1">
                {!formState.errors.measuredAt && measuredDate ? (
                  getShiftFromDate(measuredDate) !== (values.shift as string) ? (
                    <span className="text-amber-700">
                      ⚠️ Shift manually overridden and does not match measurement time ({getShiftFromDate(measuredDate)}).
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
                  setToast({ text: "⏱️ Measurement time reset to now.", color: PRIMARY });
                  setTimeout(() => setToast(null), 1800);
                }}
                className="px-3 py-2 rounded-lg border"
              >
                Set Current Time
              </button>

              <button
                type="button"
                onClick={() => {
                  setOverrideShift(false);
                  setToast({ text: "🔁 Auto shift assignment enabled.", color: PRIMARY });
                  setTimeout(() => setToast(null), 1500);
                }}
                className="px-3 py-2 rounded-lg border"
              >
                Auto-assign Shift
              </button>
            </div>
          </div>

          {/* input fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Systolic BP</label>
              <input
                {...register("systolic")}
                type="number"
                className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.systolic)}`}
              />
              <div className={`text-xs mt-1 ${levels.systolic === "danger" ? "text-red-600" : levels.systolic === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("systolic", levels.systolic) || (formState.errors.systolic ? String(formState.errors.systolic.message) : null)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Diastolic BP</label>
              <input
                {...register("diastolic")}
                type="number"
                className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.diastolic)}`}
              />
              <div className={`text-xs mt-1 ${levels.diastolic === "danger" ? "text-red-600" : levels.diastolic === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("diastolic", levels.diastolic) || (formState.errors.diastolic ? String(formState.errors.diastolic.message) : null)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Heart Rate (bpm)</label>
              <input {...register("heartRate")} type="number" className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.heartRate)}`} />
              <div className={`text-xs mt-1 ${levels.heartRate === "danger" ? "text-red-600" : levels.heartRate === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("heartRate", levels.heartRate) || (formState.errors.heartRate ? String(formState.errors.heartRate.message) : null)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Temperature (°C)</label>
              <input {...register("temperature")} type="number" step="0.1" className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.temperature)}`} />
              <div className={`text-xs mt-1 ${levels.temperature === "danger" ? "text-red-600" : levels.temperature === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("temperature", levels.temperature) || (formState.errors.temperature ? String(formState.errors.temperature.message) : null)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Respiration Rate (per min)</label>
              <input {...register("respiration")} type="number" className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.respiration)}`} />
              <div className={`text-xs mt-1 ${levels.respiration === "danger" ? "text-red-600" : levels.respiration === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("respiration", levels.respiration) || (formState.errors.respiration ? String(formState.errors.respiration.message) : null)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">SpO₂ (%)</label>
              <input {...register("spo2")} type="number" className={`mt-2 w-full rounded-lg px-3 py-2 border ${borderFor(levels.spo2)}`} />
              <div className={`text-xs mt-1 ${levels.spo2 === "danger" ? "text-red-600" : levels.spo2 === "warn" ? "text-amber-600" : "text-gray-500"}`}>
                {msgFor("spo2", levels.spo2) || (formState.errors.spo2 ? String(formState.errors.spo2.message) : null)}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-medium">Note</label>
              <textarea {...register("note")} rows={3} className="mt-2 w-full rounded-lg px-3 py-2 border border-gray-200" />
            </div>
          </div>

          {/* summary & actions */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={Object.keys(formState.errors).length > 0 || formState.isSubmitting}
              className={`px-5 py-2 rounded-lg text-white ${Object.keys(formState.errors).length > 0 || formState.isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
              {anyDanger ? "🚨 Critical values detected" : anyWarn ? "⚠️ Some values need monitoring" : "✔️ All values within range"}
            </div>
          </div>
        </form>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-white shadow-md" style={{ background: toast.color || PRIMARY }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
