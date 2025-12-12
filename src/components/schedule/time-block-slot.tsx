import React, { useState } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import type { VisitTimeBlock } from "@/apis/visit";
import type { ResidentResponse } from "@/apis/resident.api";
import { TIME_BLOCKS, formatDateLocal } from "./constants";

interface TimeBlockSlotProps {
  timeBlock: VisitTimeBlock;
  date: Date;
  activeSlot: VisitTimeBlock | null;
  setActiveSlot: React.Dispatch<React.SetStateAction<VisitTimeBlock | null>>;
  onSubmit: (data: {
    resident_id: string;
    visit_date: string;
    time_block: VisitTimeBlock;
    notes?: string;
  }) => void;
  residents: ResidentResponse[];
  availability?: {
    is_available: boolean;
    current_visitors: number;
    max_visitors: number;
  };
  disabled?: boolean;
  selectedResidentId?: string;
  selectedResidentName?: string;
  allowBooking?: boolean;
}

export function TimeBlockSlot({
  timeBlock,
  date,
  activeSlot,
  setActiveSlot,
  onSubmit,
  residents,
  availability,
  disabled = false,
  selectedResidentId,
  selectedResidentName,
  allowBooking = true,
}: TimeBlockSlotProps) {
  const isActive = activeSlot === timeBlock;
  const dayISO = formatDateLocal(date);
  const [notes, setNotes] = useState<string>("");
  const blockLabel =
    TIME_BLOCKS.find((tb) => tb.value === timeBlock)?.label || timeBlock;
  const isFull = availability ? !availability.is_available : false;

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  const isPastDate = dateToCheck < today;

  // Check if time block has passed today
  const isTimeBlockPassed = React.useMemo(() => {
    if (!isPastDate && dateToCheck.getTime() === today.getTime()) {
      // Same day - check if time block has passed
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute; // Total minutes from midnight

      // Define time block ranges (in minutes from midnight)
      // Morning: 6:00 (360) - 12:00 (720)
      // Afternoon: 12:00 (720) - 18:00 (1080)
      // Evening: 18:00 (1080) - 22:00 (1320)
      if (timeBlock === "morning") {
        // Disable morning if current time >= 12:00
        return currentTime >= 720; // 12:00
      }
      if (timeBlock === "afternoon") {
        // Disable afternoon if current time >= 18:00
        return currentTime >= 1080; // 18:00
      }
      if (timeBlock === "evening") {
        // Disable evening if current time >= 22:00
        return currentTime >= 1320; // 22:00
      }
    }
    return false;
  }, [timeBlock, dateToCheck, today, isPastDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId || isFull || isTimeBlockPassed) return;

    onSubmit({
      resident_id: selectedResidentId,
      visit_date: dayISO,
      time_block: timeBlock,
      notes: notes || undefined,
    });
    setActiveSlot(null);
    setNotes("");
  };

  const isDisabled =
    disabled ||
    isFull ||
    isPastDate ||
    isTimeBlockPassed ||
    !selectedResidentId ||
    !allowBooking;

  return (
    <div className="h-24 border-t border-gray-200">
      <button
        className={`cursor-pointer w-full h-full bg-transparent hover:bg-blue-50 flex flex-col items-center justify-center text-xs ${
          isDisabled ? "pointer-events-none opacity-50" : ""
        } ${isFull ? "bg-red-50" : ""} ${
          isPastDate || isTimeBlockPassed
            ? "bg-gray-100 cursor-not-allowed"
            : ""
        }`}
        onClick={() => !isDisabled && setActiveSlot(timeBlock)}
        disabled={isDisabled}
        title={
          isPastDate
            ? "Cannot schedule for past date"
            : isTimeBlockPassed
            ? "This time slot has passed"
            : ""
        }
      >
        <span className="font-medium">{blockLabel}</span>
        {availability && (
          <span className="text-[10px] text-gray-500">
            {availability.current_visitors}/{availability.max_visitors}
          </span>
        )}
        {isFull && <span className="text-[10px] text-red-500">Full</span>}
        {!allowBooking && (
          <span className="text-[10px] text-gray-400">View only</span>
        )}
        {!selectedResidentId && allowBooking && (
          <span className="text-[10px] text-gray-400">
            Select resident to book
          </span>
        )}
      </button>

      {isActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white shadow-lg p-6 rounded-md w-[400px] relative border-none">
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setActiveSlot(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4">Book Visit</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input
                  type="date"
                  value={dayISO}
                  disabled
                  className="border-none shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Time Slot
                </label>
                <Input
                  value={blockLabel}
                  disabled
                  className="border-none shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Resident
                </label>
                <Input
                  value={
                    selectedResidentName ||
                    residents.find((r) => r.resident_id === selectedResidentId)
                      ?.full_name ||
                    "No resident selected"
                  }
                  disabled
                  className="border-none shadow-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Notes (optional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes..."
                  className="border-none shadow-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-blue-500 text-white hover:bg-blue-600 border-none shadow-sm cursor-pointer"
                  disabled={!selectedResidentId || isFull || isTimeBlockPassed}
                >
                  Book
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveSlot(null)}
                  className="border-none shadow-sm cursor-pointer hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
