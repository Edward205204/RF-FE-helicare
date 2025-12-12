import React, { useEffect, useState, useContext } from "react";
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
import {
  getResidentsByFamily,
  type ResidentResponse,
} from "@/apis/resident.api";
import { QRCodeDisplay } from "@/components/shared/qr-code-display";
import { AppContext } from "@/contexts/app.context";
import { toast } from "react-toastify";
import { useCalendarState } from "./use-calendar-state";
import { Toolbar } from "./toolbar";
import { DayColumn } from "./day-column";
import { TIME_BLOCKS } from "./constants";
import { getSchedules, type ScheduleResponse } from "@/apis/schedule.api";
import {
  expandRecurringSchedule,
  getTimeBlockFromSchedule,
  formatDateISO,
} from "@/utils/schedule-helpers";
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
  capacity?: number;
  registered?: number;
  note: string;
  remainingSeats?: number;
  visit_id?: string;
  qr_code_data?: string;
  qr_expires_at?: string;
};

export function Calendar() {
  const {
    view,
    setView,
    cursor,
    setCursor,
    days,
    label,
    resident,
    setResident,
  } = useCalendarState();
  const { profile } = useContext(AppContext);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitResponse | null>(
    null
  );
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "care" | "visit" | "all"
  >("all");

  const [eventsState, setEventsState] = useState<CareEvent[]>([]);

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await getResidentsByFamily();
        setResidents(response.data || []);
      } catch (error: any) {
        // Only log if it's not a connection error (backend might not be running)
        if (error.code !== "ERR_NETWORK" && error.code !== "ECONNREFUSED") {
          console.error("Failed to fetch residents:", error);
          toast.error("Cannot load resident list. Please try again later.");
        } else {
          // Backend not running - silent fail, will retry when backend is up
          console.warn("Backend not available, residents will be empty");
        }
        setResidents([]);
      }
    };
    fetchResidents();
  }, []);

  useEffect(() => {
    if (!resident && residents.length > 0) {
      setResident(residents[0].resident_id);
    }
  }, [resident, residents, setResident]);

  const fetchFamilyVisits = React.useCallback(async (): Promise<
    VisitResponse[]
  > => {
    const pageSize = 100; // backend validator limits to 100
    let page = 0;
    const aggregated: VisitResponse[] = [];

    try {
      while (page < 10) {
        const response = await visitApi.getFamilyVisits({
          limit: pageSize,
          offset: page * pageSize,
        });
        const visits = response.data.visits || [];
        aggregated.push(...visits);

        if (visits.length < pageSize) {
          break; // no more pages
        }
        page += 1;
      }
      return aggregated;
    } catch (error) {
      console.error("Failed to fetch family visits:", error);
      return aggregated; // return what we already have (possibly empty)
    }
  }, []);

  const fetchSchedules = React.useCallback(async (): Promise<
    ScheduleResponse[]
  > => {
    try {
      // Calculate date range for current view
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];
      viewEnd.setHours(23, 59, 59, 999);

      const response = await getSchedules({
        start_date: viewStart.toISOString(),
        end_date: viewEnd.toISOString(),
        ...(resident ? { resident_id: resident } : {}),
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
  }, [days, resident]);

  // Fetch events for selected resident's room
  const fetchRoomEvents = React.useCallback(async (): Promise<
    EventResponse[]
  > => {
    if (!resident) {
      return [];
    }

    try {
      // Get room_id from selected resident
      const selectedResident = residents.find(
        (r) => r.resident_id === resident
      );
      const roomId =
        selectedResident?.room_id || selectedResident?.room?.room_id;

      if (!roomId) {
        return [];
      }

      // Calculate date range for current view
      const viewStart = days[0];
      const viewEnd = days[days.length - 1];
      viewEnd.setHours(23, 59, 59, 999);

      const response = await getEventsByRoom(roomId, {
        start_date: viewStart.toISOString(),
        end_date: viewEnd.toISOString(),
      });

      return response.data?.events || [];
    } catch (error) {
      console.error("Failed to fetch room events:", error);
      return [];
    }
  }, [days, resident, residents]);

  const refreshEvents = React.useCallback(async () => {
    try {
      const [visitsData, schedulesData, roomEventsData] = await Promise.all([
        fetchFamilyVisits().catch(() => []),
        fetchSchedules().catch(() => []),
        fetchRoomEvents().catch(() => []),
      ]);

      const visitEvents = mapFamilyVisitToEvent(visitsData || []);
      const scheduleEvents = mapSchedulesToEvents(schedulesData || []);
      const institutionEvents = mapInstitutionEventsToCareEvent(
        roomEventsData || []
      );
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
  }, [fetchFamilyVisits, fetchSchedules, fetchRoomEvents]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  function mapSchedulesToEvents(schedules: ScheduleResponse[]): CareEvent[] {
    return schedules
      .filter((s) => {
        if (resident) {
          return s.resident_id === resident;
        }
        return true;
      })
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
            : s.activity?.name || "Location TBD",
          staff: s.staff?.staffProfile?.full_name || "Staff",
          capacity: 1, // TODO: Get from activity.max_participants when available in API
          registered: 1, // TODO: Calculate from actual registrations
          note: s.notes || s.description || "",
        };
      });
  }

  function mapFamilyVisitToEvent(visits: VisitResponse[]): CareEvent[] {
    return visits
      .filter(
        (v) =>
          v.status === "scheduled" ||
          v.status === "approved" ||
          v.status === "pending"
      ) // Only show active visits
      .map((v) => {
        // Parse date correctly to avoid timezone issues
        // If visit_date is already a date string (YYYY-MM-DD), use it directly
        // Otherwise parse it as local date
        let dateStr: string;
        if (
          typeof v.visit_date === "string" &&
          v.visit_date.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          dateStr = v.visit_date;
        } else {
          const visitDate = new Date(v.visit_date);
          // Use local date to avoid timezone shift
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
          staff: v.family_user?.familyProfile?.full_name || "Relative",
          capacity: undefined,
          registered: undefined,
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
        const startTime = startDate.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = new Date(e.end_time).toLocaleTimeString("en-GB", {
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

  const handleSubmit = async (data: {
    resident_id: string;
    visit_date: string;
    time_block: VisitTimeBlock;
    notes?: string;
  }) => {
    try {
      const requestData = {
        resident_id: data.resident_id,
        visit_date: data.visit_date,
        time_block: data.time_block,
        notes: data.notes,
      };

      console.log("Creating visit with data:", requestData);

      const response = await visitApi.createVisit(requestData);

      const visit = response.data as VisitResponse;
      toast.success("Visit booked successfully!");

      // Optimistically inject new visit into calendar state
      const [newVisitEvent] = mapFamilyVisitToEvent([visit]);
      if (newVisitEvent) {
        setEventsState((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          map.set(newVisitEvent.id, newVisitEvent);
          return Array.from(map.values());
        });
      }

      // Refresh all events (visits + schedules)
      await refreshEvents();

      // Bật bộ lọc cư dân sang đúng người vừa đặt để hiển thị ngay lịch mới
      setResident(data.resident_id);

      // Show QR code
      setSelectedVisit(visit);
      setShowQRDialog(true);
    } catch (error: any) {
      console.error("Failed to create visit:", error);
      console.error("Error response data:", error.response?.data);

      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const errorData = error.response.data;

        // EntityError format: { message, errors: { field: { msg: string } } }
        if (errorData.errors) {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, err]: [string, any]) => {
              const fieldName =
                field === "visit_date"
                  ? "Visit Date"
                  : field === "time_block"
                  ? "Time Slot"
                  : field === "resident_id"
                  ? "Resident"
                  : field === "visit_time"
                  ? "Time"
                  : field;
              const msg = err.msg || err.message || "Unknown error";
              return `${fieldName}: ${msg}`;
            })
            .join("\n");
          toast.error(`Validation error:\n${errorMessages}`);
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error("Validation error. Please check the information.");
        }
        return;
      }

      // Handle suggestions (when time block is full)
      if (error.response?.data?.suggestions) {
        const suggestions = error.response.data.suggestions;
        const suggestionsText = suggestions
          .map(
            (s: any) =>
              `${s.date} - ${
                TIME_BLOCKS.find((tb) => tb.value === s.time_block)?.label
              } (${s.available_slots} chỗ)`
          )
          .join("\n");
        toast.error(`Cannot book. Suggestions:\n${suggestionsText}`);
      } else {
        toast.error(
          error.response?.data?.message || "Cannot book. Please try again."
        );
      }
    }
  };

  const handleVisitClick = async (visitId: string) => {
    try {
      const response = await visitApi.getVisitById(visitId);
      const visit = response.data as VisitResponse;
      setSelectedVisit(visit);
      setShowQRDialog(true);
    } catch (error) {
      console.error("Failed to fetch visit:", error);
      toast.error("Cannot load visit info.");
    }
  };

  const handleCancelVisit = async () => {
    if (!selectedVisit) return;

    try {
      setIsCancelling(true);
      await visitApi.cancelVisit(selectedVisit.visit_id);
      toast.success("Visit canceled successfully!");

      await refreshEvents();

      // Close dialogs
      setShowCancelDialog(false);
      setShowQRDialog(false);
      setSelectedVisit(null);
    } catch (error: any) {
      console.error("Failed to cancel visit:", error);
      toast.error(
        error.response?.data?.message ||
          "Cannot cancel visit. Please try again."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const currentResidentDetails = React.useMemo(() => {
    if (!resident) return null;
    return residents.find((r) => r.resident_id === resident) || null;
  }, [resident, residents]);

  return (
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
        resident={resident}
        setResident={setResident}
        eventTypeFilter={eventTypeFilter}
        setEventTypeFilter={(value) => setEventTypeFilter(value)}
        residents={residents}
      />
      {eventTypeFilter !== "all" && (
        <div className="px-4 text-xs text-slate-500">
          {eventTypeFilter === "care"
            ? "Only showing care activities. Visit slots are still reserved in the background."
            : "Only showing visits. Care activities still exist in the background."}
        </div>
      )}
      ...
      <div className="grid grid-cols-7 p-4 border-none shadow-sm rounded-md">
        {days.map((d) => (
          <DayColumn
            key={d.toDateString()}
            date={d}
            items={eventsState}
            eventTypeFilter={eventTypeFilter}
            currentResidentId={resident}
            currentResident={currentResidentDetails}
            onSubmit={handleSubmit}
            residents={residents}
            onVisitClick={handleVisitClick}
          />
        ))}
      </div>
      {/* QR Code Dialog */}
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
                    // Parse date correctly to avoid timezone issues
                    const dateStr = selectedVisit.visit_date;
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      // If it's already YYYY-MM-DD format, parse as local date
                      const [year, month, day] = dateStr.split("-").map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString("en-US");
                    }
                    // Otherwise parse normally
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

              {/* Cancel Button */}
              <Button
                variant="destructive"
                onClick={() => {
                  setShowQRDialog(false);
                  setShowCancelDialog(true);
                }}
                className="w-full border-none shadow-sm cursor-pointer bg-red-500 text-white hover:bg-red-600"
              >
                Cancel Visit
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-none shadow-sm bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this visit?
            </p>
            {selectedVisit && (
              <div className="text-sm space-y-1">
                <div>
                  <strong>Date:</strong>{" "}
                  {(() => {
                    // Parse date correctly to avoid timezone issues
                    const dateStr = selectedVisit.visit_date;
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      // If it's already YYYY-MM-DD format, parse as local date
                      const [year, month, day] = dateStr.split("-").map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString("en-US");
                    }
                    // Otherwise parse normally
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
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setShowQRDialog(true);
                }}
                disabled={isCancelling}
                className="border-none shadow-sm cursor-pointer"
              >
                No
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelVisit}
                disabled={isCancelling}
                className="border-none shadow-sm"
              >
                {isCancelling ? "Cancelling..." : "Yes, cancel visit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
