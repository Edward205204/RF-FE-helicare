import type { ScheduleResponse } from "@/apis/schedule.api";

/**
 * Expand recurring schedules into individual occurrences
 * @param schedule - The recurring schedule
 * @param startDate - Start date for expansion
 * @param endDate - End date for expansion
 * @returns Array of expanded schedule occurrences
 */
export function expandRecurringSchedule(
  schedule: ScheduleResponse,
  startDate: Date,
  endDate: Date
): ScheduleResponse[] {
  if (!schedule.is_recurring || !schedule.recurring_until) {
    return [schedule];
  }

  const occurrences: ScheduleResponse[] = [];
  const baseStart = new Date(schedule.start_time);
  const baseEnd = new Date(schedule.end_time);
  const recurringUntil = new Date(schedule.recurring_until);
  const viewStart = new Date(startDate);
  viewStart.setHours(0, 0, 0, 0);
  const viewEnd = new Date(endDate);
  viewEnd.setHours(23, 59, 59, 999);

  let currentStart = new Date(baseStart);
  let currentEnd = new Date(baseEnd);

  while (currentStart <= recurringUntil && currentStart <= viewEnd) {
    // Only include if within view range
    if (currentStart >= viewStart || currentEnd >= viewStart) {
      const occurrence: ScheduleResponse = {
        ...schedule,
        // Use original schedule_id for all occurrences (they're virtual)
        // Frontend will handle display, backend handles the actual recurring logic
        start_time: currentStart.toISOString(),
        end_time: currentEnd.toISOString(),
      };
      occurrences.push(occurrence);
    }

    // Move to next occurrence based on frequency
    switch (schedule.frequency) {
      case "daily":
        currentStart.setDate(currentStart.getDate() + 1);
        currentEnd.setDate(currentEnd.getDate() + 1);
        break;
      case "weekly":
        currentStart.setDate(currentStart.getDate() + 7);
        currentEnd.setDate(currentEnd.getDate() + 7);
        break;
      case "monthly":
        currentStart.setMonth(currentStart.getMonth() + 1);
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        break;
      default:
        // one_time or custom - stop
        return occurrences.length > 0 ? occurrences : [schedule];
    }
  }

  return occurrences.length > 0 ? occurrences : [schedule];
}

/**
 * Convert schedule to time block based on start time
 */
export function getTimeBlockFromSchedule(
  schedule: ScheduleResponse
): "morning" | "afternoon" | "evening" | null {
  const startTime = new Date(schedule.start_time);
  const hour = startTime.getHours();

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return null;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
