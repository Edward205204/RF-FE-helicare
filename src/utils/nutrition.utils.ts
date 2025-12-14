import { CareLogResponse } from "@/apis/carelog.api";
import { WeeklyMenuItem, MealSlot } from "@/apis/menu-planner.api";

export const formatMetric = (
  value: number | undefined,
  options?: { unit?: string; fallback?: string }
) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return options?.fallback ?? "—";
  }
  const rounded = Math.round(value);
  return `${rounded}${options?.unit ? ` ${options.unit}` : ""}`;
};

export const extractApiData = <T>(payload: unknown): T | null => {
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

export const normalizeDayIndex = (
  value: number | string | null | undefined
): number => {
  const dayNameToIndex: Record<string, number> = {
    monday: 0,
    mon: 0,
    tuesday: 1,
    tue: 1,
    wednesday: 2,
    wed: 2,
    thursday: 3,
    thu: 3,
    thur: 3,
    friday: 4,
    fri: 4,
    saturday: 5,
    sat: 5,
    sunday: 6,
    sun: 6,
  };

  if (typeof value === "number" && Number.isFinite(value)) {
    return ((value % 7) + 7) % 7;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed in dayNameToIndex) {
      return dayNameToIndex[trimmed];
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return ((parsed % 7) + 7) % 7;
    }
  }
  return -1;
};

export const getWeekEndDateString = (weekStart: string) => {
  const parseDateInput = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const toStartOfDay = (date: Date) => {
      const cloned = new Date(date);
      cloned.setHours(0, 0, 0, 0);
      return cloned;
    };
    return toStartOfDay(date);
  };

  const addDays = (base: Date, days: number) => {
    const cloned = new Date(base);
    cloned.setDate(cloned.getDate() + days);
    return cloned;
  };

  const startDate = parseDateInput(weekStart);
  if (!startDate) return weekStart;
  const endDate = addDays(startDate, 6);
  return endDate.toISOString().split("T")[0];
};

export const mealSlotKeywordMap: Record<MealSlot, string[]> = {
  Breakfast: ["breakfast", "sáng", "morning"],
  Lunch: ["lunch", "trưa", "midday"],
  Afternoon: ["afternoon", "snack", "xế"],
  Dinner: ["dinner", "tối", "evening", "supper"],
};

export const consumptionPatterns: Array<{
  regex: RegExp;
  ratio: number;
  label: string;
}> = [
  {
    regex: /(100%|full|đầy|ăn hết|1\s?suất|toàn bộ)/i,
    ratio: 1,
    label: "Ăn hết khẩu phần",
  },
  { regex: /(75%|3\/4|0\.75)/i, ratio: 0.75, label: "Ăn 75% khẩu phần" },
  {
    regex: /(50%|half|1\/2|nửa\s?suất|0\.5)/i,
    ratio: 0.5,
    label: "Ăn 50% khẩu phần",
  },
  { regex: /(25%|1\/4|0\.25|ăn nhẹ)/i, ratio: 0.25, label: "Ăn nhẹ (~25%)" },
  {
    regex: /(0%|skip|skipped|bỏ bữa|không ăn|refuse)/i,
    ratio: 0,
    label: "Bỏ bữa",
  },
];

export interface ConsumptionInfo {
  label: string;
  ratio: number;
  log?: CareLogResponse;
}

export const EMPTY_CONSUMPTION: ConsumptionInfo = {
  label: "Chưa ghi nhận",
  ratio: 0,
};

export const deriveConsumptionFromLog = (
  log?: CareLogResponse
): ConsumptionInfo => {
  if (!log) return { ...EMPTY_CONSUMPTION };

  const combinedText = `${log.quantity || ""} ${log.notes || ""} ${
    log.food_items || ""
  }`.trim();

  const matchedPattern = consumptionPatterns.find((pattern) =>
    pattern.regex.test(combinedText)
  );

  if (matchedPattern) {
    return {
      label: matchedPattern.label,
      ratio: matchedPattern.ratio,
      log,
    };
  }

  if (log.status === "completed") {
    return { label: "Đã phục vụ đầy đủ", ratio: 1, log };
  }

  if (log.status === "in_progress") {
    return { label: "Đang phục vụ", ratio: 0.5, log };
  }

  return { label: "Đang chờ ghi nhận", ratio: 0, log };
};

export const isSameDay = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

export const matchMealLogForMenuItem = (
  menuItem: WeeklyMenuItem,
  logs: CareLogResponse[],
  weekStartDate: Date | null
) => {
  if (!weekStartDate) return undefined;
  const addDays = (base: Date, days: number) => {
    const cloned = new Date(base);
    cloned.setDate(cloned.getDate() + days);
    return cloned;
  };
  const dayIndex = normalizeDayIndex(menuItem.day_of_week);
  if (dayIndex < 0) return undefined;
  const targetDate = addDays(weekStartDate, dayIndex);
  const sameDayLogs = logs.filter((log) => {
    if (!log.start_time) return false;
    const logDate = new Date(log.start_time);
    if (Number.isNaN(logDate.getTime())) return false;
    return isSameDay(logDate, targetDate);
  });

  if (sameDayLogs.length === 0) {
    return undefined;
  }

  const slotKeywords = mealSlotKeywordMap[menuItem.meal_slot as MealSlot] || [];
  const dishName = menuItem.dish?.name?.toLowerCase();

  const slotMatchedLogs =
    slotKeywords.length > 0
      ? sameDayLogs.filter((log) => {
          if (!log.meal_type) return true;
          const normalizedType = log.meal_type.toLowerCase();
          return slotKeywords.some((keyword) =>
            normalizedType.includes(keyword)
          );
        })
      : sameDayLogs;

  const dishMatchedLog =
    dishName && dishName.length > 0
      ? slotMatchedLogs.find((log) => {
          const combined = `${log.food_items || ""} ${
            log.title || ""
          }`.toLowerCase();
          return combined.includes(dishName);
        })
      : undefined;

  return dishMatchedLog || slotMatchedLogs[0] || sameDayLogs[0];
};
