import React, { useEffect, useState, useContext, useCallback } from "react";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  visitApi,
  type VisitTimeBlock,
  type VisitResponse,
} from "@/apis/visit";
import { QRCodeDisplay } from "@/components/shared/qr-code-display";
import { AppContext } from "@/contexts/app.context";
import { toast } from "react-toastify";
import { useCalendarState } from "@/components/schedule/use-calendar-state";
import { Toolbar } from "@/components/schedule/toolbar";
import { DayColumn } from "@/components/schedule/day-column";
import { TIME_BLOCKS } from "@/components/schedule/constants";
import { getSchedules, type ScheduleResponse } from "@/apis/schedule.api";
import {
  expandRecurringSchedule,
  getTimeBlockFromSchedule,
  formatDateISO,
} from "@/utils/schedule-helpers";
import { UserRole } from "@/constants/user-role";
import type { ResidentResponse } from "@/apis/resident.api";
import { getEventsByRoom, type EventResponse } from "@/apis/event.api";

type CareEvent = {
  id: string;
  date: string;
  start?: string;
  end?: string;
  time_block?: VisitTimeBlock;
  name: string;
  type: "care" | "visit";
  resident_id?: string;
  location: string;
  staff: string;
  capacity: number;
  registered: number;
  note: string;
  remainingSeats?: number;
  visit_id?: string;
  qr_code_data?: string;
  qr_expires_at?: string;
};

export function ResidentSchedule() {
  const { view, setView, cursor, setCursor, days, label } = useCalendarState();
  const { profile } = useContext(AppContext);
  const [selectedVisit, setSelectedVisit] = useState<VisitResponse | null>(
    null
  );
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "care" | "visit" | "all"
  >("all");
  const [eventsState, setEventsState] = useState<CareEvent[]>([]);

  // Get resident_id from profile
  const residentId = (profile as any)?.resident?.resident_id;
  const residentInfo: ResidentResponse | null = profile?.resident
    ? {
        resident_id: (profile as any).resident.resident_id,
        full_name: (profile as any).resident.full_name,
        gender: (profile as any).resident.gender || "male",
        date_of_birth: (profile as any).resident.date_of_birth,
        room: (profile as any).resident.room,
      }
    : null;

  // Fetch visits for this resident only
  const fetchResidentVisits = useCallback(async (): Promise<
    VisitResponse[]
  > => {
    if (!residentId) {
      return [];
    }

    const pageSize = 100;
    let page = 0;
    const aggregated: VisitResponse[] = [];

    try {
      while (page < 10) {
        const response = await visitApi.getResidentVisits({
          limit: pageSize,
          offset: page * pageSize,
        });
        const visits = response.data?.visits || [];
        aggregated.push(...visits);

        if (visits.length < pageSize) {
          break;
        }
        page += 1;
      }
      return aggregated;
    } catch (error) {
      console.error("Failed to fetch resident visits:", error);
      return aggregated;
    }
  }, [residentId]);

  // Fetch schedules for this resident only
  const fetchSchedules = useCallback(async (): Promise<ScheduleResponse[]> => {
    if (!residentId) {
      return [];
    }

    try {
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];
      viewEnd.setHours(23, 59, 59, 999);

      const response = await getSchedules({
        start_date: viewStart.toISOString(),
        end_date: viewEnd.toISOString(),
        resident_id: residentId,
      });

      const schedules = response.data?.schedules || [];

      // Expand recurring schedules
      const expanded: ScheduleResponse[] = [];
      schedules.forEach((schedule: ScheduleResponse) => {
        const occurrences = expandRecurringSchedule(
          schedule,
          viewStart,
          viewEnd
        );
        expanded.push(...occurrences);
      });

      return expanded;
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      return [];
    }
  }, [days, residentId]);

  // Fetch events for this resident's room
  const fetchRoomEvents = useCallback(async (): Promise<EventResponse[]> => {
    if (!residentId || !residentInfo?.room_id) {
      return [];
    }

    try {
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];
      viewEnd.setHours(23, 59, 59, 999);

      const response = await getEventsByRoom(residentInfo.room_id, {
        start_date: viewStart.toISOString(),
        end_date: viewEnd.toISOString(),
      });

      return response.data?.events || [];
    } catch (error) {
      console.error("Failed to fetch room events:", error);
      return [];
    }
  }, [days, residentId, residentInfo?.room_id]);

  const refreshEvents = useCallback(async () => {
    if (!residentId) {
      setEventsState([]);
      return;
    }

    try {
      const [visitsData, schedulesData, roomEventsData] = await Promise.all([
        fetchResidentVisits().catch(() => []),
        fetchSchedules().catch(() => []),
        fetchRoomEvents().catch(() => []),
      ]);

      // Filter visits to only show this resident's visits
      const filteredVisits = visitsData.filter(
        (v) => v.resident_id === residentId
      );

      const visitEvents = mapVisitToEvent(filteredVisits);
      const scheduleEvents = mapSchedulesToEvents(schedulesData);
      const institutionEvents = mapInstitutionEventsToCareEvent(roomEventsData);
      const allEvents = [
        ...visitEvents,
        ...scheduleEvents,
        ...institutionEvents,
      ];
      const uniqueEvents = Array.from(
        new Map(allEvents.map((e) => [e.id, e])).values()
      );
      setEventsState(uniqueEvents);
    } catch (err: any) {
      if (err.code !== "ERR_NETWORK" && err.code !== "ECONNREFUSED") {
        console.error("Failed to fetch events:", err);
      }
      setEventsState([]);
    }
  }, [fetchResidentVisits, fetchSchedules, fetchRoomEvents, residentId]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  function mapSchedulesToEvents(schedules: ScheduleResponse[]): CareEvent[] {
    return schedules
      .filter((s) => s.resident_id === residentId)
      .map((s) => {
        const startDate = new Date(s.start_time);
        const dateStr = formatDateISO(startDate);
        const timeBlock = getTimeBlockFromSchedule(s);

        return {
          id: s.schedule_id,
          date: dateStr,
          start: s.start_time,
          end: s.end_time,
          time_block: timeBlock || undefined,
          name: s.title,
          type: "care" as const,
          resident_id: s.resident_id || undefined,
          location: s.resident?.room_id
            ? `Room ${s.resident.room_id}`
            : s.activity?.name || "Unknown",
          staff:
            s.staff?.staffProfile?.full_name ||
            s.assigned_staff_name ||
            "Staff",
          capacity: s.activity?.max_participants || undefined,
          registered: s.participant_count || undefined,
          note: s.notes || s.description || "",
        };
      });
  }

  function mapVisitToEvent(visits: VisitResponse[]): CareEvent[] {
    return visits
      .filter(
        (v) =>
          (v.status === "scheduled" ||
            v.status === "approved" ||
            v.status === "pending") &&
          v.resident_id === residentId
      )
      .map((v) => {
        let dateStr: string;
        if (
          typeof v.visit_date === "string" &&
          v.visit_date.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          dateStr = v.visit_date;
        } else {
          const visitDate = new Date(v.visit_date);
          const year = visitDate.getFullYear();
          const month = String(visitDate.getMonth() + 1).padStart(2, "0");
          const day = String(visitDate.getDate()).padStart(2, "0");
          dateStr = `${year}-${month}-${day}`;
        }
        const timeBlockLabel = v.time_block
          ? TIME_BLOCKS.find((tb) => tb.value === v.time_block)?.label ||
            v.time_block
          : "Family Visit";

        return {
          id: v.visit_id,
          visit_id: v.visit_id,
          resident_id: v.resident_id,
          date: dateStr,
          time_block: v.time_block || undefined,
          name: timeBlockLabel,
          type: "visit" as const,
          location: v.institution?.name || "Nursing Home",
          staff: v.family_user?.familyProfile?.full_name || "Family Member",
          capacity: undefined, // Visit không có capacity field
          registered: undefined, // Visit không có registered field
          note: v.notes || "",
          qr_code_data: v.qr_code_data,
          qr_expires_at: v.qr_expires_at,
        };
      });
  }

  // Map institution events (from room) to CareEvent
  function mapInstitutionEventsToCareEvent(
    events: EventResponse[]
  ): CareEvent[] {
    return events
      .filter((e) => e.status === "Upcoming" || e.status === "Ongoing") // Only show upcoming/ongoing events
      .map((e) => {
        const startDate = new Date(e.start_time);
        const dateStr = formatDateISO(startDate);
        const startTime = startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = new Date(e.end_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Determine time_block from start_time
        const hour = startDate.getHours();
        let timeBlock: VisitTimeBlock | undefined;
        if (hour >= 6 && hour < 12) {
          timeBlock = "morning";
        } else if (hour >= 12 && hour < 18) {
          timeBlock = "afternoon";
        } else if (hour >= 18 && hour < 22) {
          timeBlock = "evening";
        }

        return {
          id: e.event_id,
          date: dateStr,
          start: e.start_time,
          end: e.end_time,
          time_block: timeBlock,
          name: e.name,
          type: "care" as const,
          location: e.location,
          staff: "Event",
          capacity: undefined,
          registered: undefined,
          note: `${startTime} - ${endTime}`,
        };
      });
  }

  const handleVisitClick = async (visitId: string) => {
    try {
      const response = await visitApi.getVisitById(visitId);
      const visit = response.data as VisitResponse;

      // Only show if this visit belongs to this resident
      if (visit.resident_id === residentId) {
        setSelectedVisit(visit);
        setShowQRDialog(true);
      } else {
        toast.error("You do not have permission to view this visit.");
      }
    } catch (error) {
      console.error("Failed to fetch visit:", error);
      toast.error("Cannot load visit information.");
    }
  };

  if (!residentId) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center text-gray-500">
          Resident information not found. Please login again.
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 space-y-4"
      style={{ width: "100%", overflowX: "auto", maxWidth: "100vw" }}
    >
      <div className="space-y-4 border-none shadow-sm p-4 rounded-md">
        <Toolbar
          className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4"
          view={view}
          setView={setView}
          label={label}
          onPrev={() =>
            setCursor(
              new Date(cursor.getTime() - (view === "day" ? 1 : 7) * 86400000)
            )
          }
          onNext={() =>
            setCursor(
              new Date(cursor.getTime() + (view === "day" ? 1 : 7) * 86400000)
            )
          }
          onToday={() => setCursor(new Date())}
          resident={residentId}
          setResident={() => {}} // No-op for resident role
          eventTypeFilter={eventTypeFilter}
          setEventTypeFilter={(value) => setEventTypeFilter(value)}
          residents={residentInfo ? [residentInfo] : []}
          showResidentSelector={false} // Hide resident selector for resident role
        />
        {eventTypeFilter !== "all" && (
          <div className="px-4 text-xs text-slate-500">
            {eventTypeFilter === "care"
              ? "Showing care activities only."
              : "Showing visits only."}
          </div>
        )}
        <div className="grid grid-cols-7 p-4 border-none shadow-sm rounded-md">
          {days.map((d) => (
            <DayColumn
              key={d.toDateString()}
              date={d}
              items={eventsState}
              eventTypeFilter={eventTypeFilter}
              currentResidentId={residentId}
              currentResident={residentInfo}
              onSubmit={() => {
                // Resident cannot book visits
                toast.info(
                  "Residents cannot book visits. Please contact your family."
                );
              }}
              residents={residentInfo ? [residentInfo] : []}
              onVisitClick={handleVisitClick}
              allowBooking={false} // Disable booking for resident
            />
          ))}
        </div>
      </div>

      {/* QR Code Dialog - Read only for resident */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="border-none shadow-sm bg-white">
          <DialogHeader>
            <DialogTitle>Visit Details</DialogTitle>
          </DialogHeader>
          {selectedVisit && (
            <div className="space-y-4">
              {selectedVisit.qr_code_data && (
                <QRCodeDisplay
                  qrCodeData={selectedVisit.qr_code_data}
                  expiresAt={selectedVisit.qr_expires_at}
                  onClose={() => setShowQRDialog(false)}
                />
              )}

              {/* Visit Details */}
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Date:</strong>{" "}
                  {(() => {
                    const dateStr = selectedVisit.visit_date;
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      const [year, month, day] = dateStr.split("-").map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString("en-US");
                    }
                    return new Date(dateStr).toLocaleDateString("en-US");
                  })()}
                </div>
                {selectedVisit.time_block && (
                  <div>
                    <strong>Time Slot:</strong>{" "}
                    {TIME_BLOCKS.find(
                      (tb) => tb.value === selectedVisit.time_block
                    )?.label || selectedVisit.time_block}
                  </div>
                )}
                {selectedVisit.resident && (
                  <div>
                    <strong>Resident:</strong>{" "}
                    {selectedVisit.resident.full_name}
                  </div>
                )}
                {selectedVisit.notes && (
                  <div>
                    <strong>Notes:</strong> {selectedVisit.notes}
                  </div>
                )}
              </div>

              {/* Note: Resident cannot cancel visits */}
              <div className="text-xs text-gray-500 italic">
                Note: Residents cannot cancel visits. Please contact your family
                if changes are needed.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ResidentSchedule;
