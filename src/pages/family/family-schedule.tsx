//family & resident can register/cancel events, view calendar

import { Calendar } from "@/components/schedule/calendar";

export function WeeklyDailyCalendar() {
  return (
    <div
      className="p-4 md:p-6 space-y-4"
      style={{ width: "100%", overflowX: "auto", maxWidth: "100vw" }}
    >
      <Calendar />

      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold mb-2 text-left">Event Types</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sky-100 border border-sky-200 rounded"></div>
            <span>Care</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
            <span>Visit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 border border-red-500 rounded"></div>
            <span>No slots</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyDailyCalendar;
