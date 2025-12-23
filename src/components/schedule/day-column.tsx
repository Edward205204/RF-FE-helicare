import React, { useState } from "react";
import type { VisitTimeBlock, AvailabilityResponse } from "@/apis/visit";
import type { ResidentResponse } from "@/apis/resident.api";
import { TIME_BLOCKS, formatDateLocal } from "./constants";
import { TimeBlockSlot } from "./time-block-slot";

interface CalendarEvent {
  id: string;
  date: string;
  time_block?: VisitTimeBlock;
  name: string;
  type: "care" | "visit";
  visit_id?: string;
  staff?: string;
  resident_id?: string;
}

interface DayColumnProps {
  date: Date;
  items: CalendarEvent[];
  eventTypeFilter?: "care" | "visit" | "all";
  currentResidentId?: string | null;
  currentResident?: ResidentResponse | null;
  onSubmit: (data: {
    resident_id: string;
    visit_date: string;
    time_block: VisitTimeBlock;
    notes?: string;
  }) => void;
  residents: ResidentResponse[];
  availability?: AvailabilityResponse;
  onVisitClick: (visitId: string) => void;
  allowBooking?: boolean;
}

export function DayColumn({
  date,
  items,
  eventTypeFilter = "all",
  currentResidentId,
  currentResident,
  onSubmit,
  residents,
  availability,
  onVisitClick,
  allowBooking = true,
}: DayColumnProps) {
  const [activeSlot, setActiveSlot] = useState<VisitTimeBlock | null>(null);
  const dayISO = formatDateLocal(date);
  const dayEvents = items.filter((e) => e.date === dayISO);
  const residentEvents = currentResidentId
    ? dayEvents.filter(
        (event) => !event.resident_id || event.resident_id === currentResidentId
      )
    : dayEvents;
  const visibleEvents =
    eventTypeFilter === "all"
      ? residentEvents
      : residentEvents.filter((event) => event.type === eventTypeFilter);
  const residentNameMap = React.useMemo(() => {
    return residents.reduce<Record<string, string>>((acc, r) => {
      acc[r.resident_id] = r.full_name;
      return acc;
    }, {});
  }, [residents]);

  const residentVisitEvents = residentEvents.filter(
    (event) => event.type === "visit"
  );

  // Only show “cư dân khác” overlay when chúng ta biết chắc đó là visit thực
  // của một cư dân khác trong danh sách gia đình (có resident_id và tên).
  const otherResidentVisits = currentResidentId
    ? dayEvents.filter((event) => {
        if (
          event.type !== "visit" ||
          !event.resident_id ||
          event.resident_id === currentResidentId
        ) {
          return false;
        }
        // Nếu backend không trả tên cư dân (không nằm trong residentNameMap)
        // thì bỏ qua, không render block “Cư dân khác” để tránh cảm giác giả.
        return Boolean(residentNameMap[event.resident_id]);
      })
    : [];

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  const isPastDate = dateToCheck < today;

  return (
    <div
      className={`border-r relative flex flex-col border-gray-200 ${
        isPastDate ? "opacity-50" : ""
      }`}
    >
      <div
        className={`h-10 flex items-center justify-center text-xs border-b border-gray-200 ${
          isPastDate ? "text-gray-400" : ""
        }`}
      >
        {date.toLocaleDateString("vi-VN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })}
      </div>
      <div className="relative">
        {TIME_BLOCKS.map((tb) => {
          const blockAvailability = availability?.time_blocks?.find(
            (b: any) => b.time_block === tb.value
          );
          const hasVisitEvent = residentVisitEvents.some(
            (e) => e.time_block === tb.value
          );

          // Check if time block has passed today
          const isTimeBlockPassed = React.useMemo(() => {
            if (!isPastDate && dateToCheck.getTime() === today.getTime()) {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentTime = currentHour * 60 + currentMinute; // Total minutes from midnight

              // Define time block ranges (in minutes from midnight)
              // Morning: 6:00 (360) - 12:00 (720)
              // Afternoon: 12:00 (720) - 18:00 (1080)
              // Evening: 18:00 (1080) - 22:00 (1320)
              if (tb.value === "morning") {
                // Disable morning if current time >= 12:00
                return currentTime >= 720; // 12:00
              }
              if (tb.value === "afternoon") {
                // Disable afternoon if current time >= 18:00
                return currentTime >= 1080; // 18:00
              }
              if (tb.value === "evening") {
                // Disable evening if current time >= 22:00
                return currentTime >= 1320; // 22:00
              }
            }
            return false;
          }, [tb.value, dateToCheck, today, isPastDate]);

          return (
            <TimeBlockSlot
              key={tb.value}
              timeBlock={tb.value}
              date={date}
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              onSubmit={onSubmit}
              residents={residents}
              availability={blockAvailability}
              selectedResidentId={currentResidentId || undefined}
              selectedResidentName={
                currentResident?.full_name ||
                (currentResidentId
                  ? residentNameMap[currentResidentId] || ""
                  : "")
              }
              disabled={
                hasVisitEvent ||
                isPastDate ||
                isTimeBlockPassed ||
                !allowBooking
              }
              allowBooking={allowBooking}
            />
          );
        })}

        {/* Render events (visits and care events) that have time_block - positioned within their time block slot */}
        {visibleEvents
          .filter((ev) => ev.time_block)
          .map((ev) => {
            const timeBlockIndex = TIME_BLOCKS.findIndex(
              (tb) => tb.value === ev.time_block
            );
            if (timeBlockIndex === -1) return null;

            // Different styling for care events vs visits
            const isCareEvent = ev.type === "care";
            const bgColor = isCareEvent
              ? "bg-blue-50 ring-blue-200"
              : "bg-amber-50 ring-amber-200";

            // Each time block slot is 96px (h-24 = 96px), position event block within the slot
            return (
              <div
                key={ev.id}
                className={`absolute left-1 right-1 rounded-xl ring-1 text-left p-2 shadow-sm hover:shadow ${bgColor} z-20 cursor-pointer`}
                style={{
                  height: "80px", // Slightly smaller than slot height to fit nicely
                  top: `${timeBlockIndex * 96 + 8}px`, // Position within the slot with small margin
                }}
                onClick={() => {
                  if (ev.type === "visit" && ev.visit_id) {
                    onVisitClick(ev.visit_id);
                  }
                  // TODO: Add onClick handler for care events
                }}
              >
                <div className="font-medium text-xs truncate">{ev.name}</div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {isCareEvent ? "Chăm sóc" : "Đã đặt"}
                </div>
                {ev.staff && (
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                    {ev.staff}
                  </div>
                )}
              </div>
            );
          })}
        {otherResidentVisits
          .filter((ev) => ev.time_block)
          .map((ev) => {
            const timeBlockIndex = TIME_BLOCKS.findIndex(
              (tb) => tb.value === ev.time_block
            );
            if (timeBlockIndex === -1) return null;
            const otherResidentName =
              (ev.resident_id && residentNameMap[ev.resident_id]) || "";
            return (
              <div
                key={`${ev.id}-other`}
                className="absolute left-2 right-2 rounded-xl ring-1 text-left p-2 bg-red-100 ring-red-300 border border-red-300 text-red-700 text-[10px] z-10 pointer-events-none opacity-80"
                style={{
                  height: "80px",
                  top: `${timeBlockIndex * 96 + 8}px`,
                }}
              >
                <div className="font-semibold truncate text-[11px]">
                  Đã đặt cho cư dân khác
                </div>
                {otherResidentName && (
                  <div className="truncate mt-0.5">{otherResidentName}</div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
