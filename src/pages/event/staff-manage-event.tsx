import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Badge } from "@/components/ui";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

import { useNavigate, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import MultiSelect from "react-select";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import path from "@/constants/path";
import { usePaginationQuerySync } from "@/hooks/use-pagination-query";
import {
  getEvents,
  updateEvent,
  deleteEvent,
  type EventResponse,
  type EventType,
  type EventStatus,
  type CareSubType,
  type EventFrequency,
} from "@/apis/event.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import { toast } from "react-toastify";

type StaffEvent = {
  id: string;
  name: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: EventStatus;
  careSubType?: CareSubType;
  frequency?: EventFrequency;
  roomIds?: string[];
};

// Zod schema for form validation
const eventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Care", "Entertainment", "Other"]),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  careSubType: z.string().optional(),
  frequency: z.string().optional(),
  roomIds: z.array(z.string()).optional(),
  status: z.enum(["Upcoming", "Cancelled", "Ongoing", "Ended"]),
});

const defaultValues: z.infer<typeof eventSchema> = {
  name: "",
  type: "Care",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  careSubType: "",
  frequency: "",
  roomIds: [],
  status: "Upcoming",
};

const RANGE = 2;
type PaginationItem = number | "ellipsis";

const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const candidates = new Set<number>();
  for (let i = currentPage - RANGE; i <= currentPage + RANGE; i += 1) {
    if (i >= 1 && i <= totalPages) {
      candidates.add(i);
    }
  }
  candidates.add(1);
  if (totalPages >= 2) {
    candidates.add(2);
    candidates.add(totalPages);
    if (totalPages - 1 > 0) {
      candidates.add(totalPages - 1);
    }
  }

  const sorted = Array.from(candidates).sort((a, b) => a - b);
  const result: PaginationItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (page - prev > 1) {
        result.push("ellipsis");
      }
    }
    result.push(page);
  });
  return result;
};

const StaffEventManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { page, limit, setPage, setLimit } = usePaginationQuerySync(10);
  const [events, setEvents] = useState<StaffEvent[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filterStatus, setFilterStatus] = useState<EventStatus | "all">("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCareType, setFilterCareType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const previousLocationKey = useRef<string | undefined>(undefined);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  // sync local hour/minute with form's startTime
  const startTimeValue = form.watch("startTime");
  useEffect(() => {
    const st = startTimeValue || "";
    if (st && st.includes(":")) {
      st.split(":"); // Split the time string without assigning unused variables
    }
  }, [startTimeValue]);

  // Shared function to refresh events with pagination
  const refreshEventsList = useCallback(async () => {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);

      const skip = (page - 1) * limit;

      const response = await getEvents({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        take: limit,
        skip: skip,
      });

      const events = response.data?.events || [];
      const paginationData = response.data?.pagination;

      if (paginationData) {
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
        });
      } else {
        // Fallback if pagination not available
        const total = response.data?.total || 0;
        setPagination({
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        });
      }

      const mappedEvents = events.map((e: EventResponse) => {
        return mapEventToStaffEvent(e);
      });

      setEvents(mappedEvents);
      return mappedEvents;
    } catch (error: any) {
      console.error("❌ [refreshEventsList] Failed to refresh events:", error);
      toast.error(
        "Không thể tải lại danh sách sự kiện. Vui lòng refresh trang."
      );
      return [];
    }
  }, [page, limit]);

  // Fetch events and rooms from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, roomsResponse] = await Promise.all([
          refreshEventsList(),
          getRooms(),
        ]);

        setRooms(roomsResponse.data || []);
        console.log(
          "Initial fetch completed:",
          eventsResponse.length,
          "events"
        );
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast.error("Không thể tải danh sách sự kiện. Vui lòng thử lại sau.");
        setEvents([]);
      }
    };

    fetchData();
  }, [refreshEventsList]);

  // Handle new event from create page - refresh from server to get correct status
  // Use location.key to detect navigation changes
  useEffect(() => {
    const hasNewEvent = location.state?.newEvent;
    const locationKeyChanged = previousLocationKey.current !== location.key;

    // Always refresh if we have newEvent in state, or if location key changed (navigation occurred)
    if (
      hasNewEvent ||
      (locationKeyChanged && previousLocationKey.current !== undefined)
    ) {
      console.log(
        "Navigation detected. Has new event:",
        hasNewEvent,
        "Location key changed:",
        locationKeyChanged,
        "Current location key:",
        location.key,
        "Previous location key:",
        previousLocationKey.current
      );

      // Refresh events from server to ensure correct status and room_ids
      const refreshEvents = async () => {
        try {
          const refreshedEvents = await refreshEventsList();

          // Reset filters to show all events
          setFilterStatus("all");
          setFilterType("all");
          setFilterCareType("all");
          setFilterFrom("");
          setFilterTo("");

          if (hasNewEvent) {
            if (refreshedEvents.length > 0) {
              toast.success("Sự kiện đã được tạo và hiển thị trong danh sách!");
            } else {
              toast.warning(
                "Sự kiện đã được tạo nhưng không tìm thấy trong danh sách. Vui lòng kiểm tra lại."
              );
            }
          }
        } catch (error) {
          console.error("Error refreshing events:", error);
        }
      };

      refreshEvents();

      // Update previous location key
      previousLocationKey.current = location.key;

      // Clear location.state to prevent re-triggering
      if (hasNewEvent) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    } else {
      // Update previous location key even if no refresh (first mount)
      if (previousLocationKey.current === undefined) {
        previousLocationKey.current = location.key;
      }
    }
  }, [
    location.state,
    location.key,
    location.pathname,
    refreshEventsList,
    navigate,
  ]);

  // Filter events based on criteria
  const filteredEvents = events.filter((e) => {
    const statusOk = filterStatus === "all" || e.status === filterStatus;
    const typeOk = filterType === "all" || e.type === filterType;

    const careTypeOk =
      e.type !== "Care" ||
      filterCareType === "all" ||
      e.careSubType === filterCareType;

    const dateOk = (() => {
      const eventDate = new Date(e.date).getTime();
      const from = filterFrom ? new Date(filterFrom).getTime() : null;
      const to = filterTo ? new Date(filterTo).getTime() : null;

      if (from && to) return eventDate >= from && eventDate <= to;
      if (from) return eventDate >= from;
      if (to) return eventDate <= to;

      return true;
    })();

    const passes = statusOk && typeOk && careTypeOk && dateOk;

    if (!passes) {
      console.log("🚫 [filteredEvents] Event filtered out:", {
        id: e.id,
        name: e.name,
        status: e.status,
        filterStatus,
        statusOk,
        type: e.type,
        filterType,
        typeOk,
        careTypeOk,
        dateOk,
      });
    }

    return passes;
  });

  console.log("🔍 [filteredEvents] Filter results:", {
    totalEvents: events.length,
    filteredCount: filteredEvents.length,
    filters: {
      status: filterStatus,
      type: filterType,
      careType: filterCareType,
      from: filterFrom,
      to: filterTo,
    },
  });

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted successfully");
      setToastMessage("Event deleted");
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      toast.error(error.response?.data?.message || "Failed to delete event");
      setToastMessage("Error deleting event");
    }
  };

  const openEditDialog = (event: StaffEvent) => {
    try {
      setEditingEventId(event.id);

      // event.startTime và event.endTime là string "HH:MM", event.date là "YYYY-MM-DD"
      const dateStr = event.date;
      const startTimeStr = event.startTime; // Already in "HH:MM" format
      const endTimeStr = event.endTime; // Already in "HH:MM" format

      form.reset({
        name: event.name,
        type: event.type,
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: event.location,
        careSubType: event.careSubType || "",
        frequency: event.frequency || "",
        roomIds: event.roomIds || [],
        status: event.status,
      });

      setDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit dialog:", error);
      toast.error("Không thể mở form chỉnh sửa. Vui lòng thử lại.");
    }
  };

  const saveUpdateEvent = async (values: z.infer<typeof eventSchema>) => {
    if (!editingEventId) return;

    try {
      const startDateTime = new Date(`${values.date}T${values.startTime}`);
      const endDateTime = new Date(`${values.date}T${values.endTime}`);

      const updateData: any = {
        name: values.name,
        type: values.type,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: values.location,
        room_ids: values.roomIds || [],
      };

      // Only allow Cancelled status to be set manually; Ongoing/Ended are auto-calculated
      if (values.status === "Cancelled") {
        updateData.status = "Cancelled";
      }

      // Update care configuration if type is Care
      if (values.type === "Care" && values.careSubType) {
        updateData.care_configuration = {
          subType: values.careSubType,
          frequency: values.frequency || undefined,
        };
      }

      await updateEvent(editingEventId, updateData);

      // Refresh events list using shared function
      await refreshEventsList();

      setDialogOpen(false);
      toast.success("Event updated successfully");
      setToastMessage("Event updated successfully");
    } catch (error: any) {
      console.error("Failed to update event:", error);
      toast.error(error.response?.data?.message || "Failed to update event");
    }
  };

  // Notification Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const upcoming = events.filter((e) => {
        const start = new Date(`${e.date}T${e.startTime}`).getTime();
        return start - now <= 15 * 60 * 1000 && start > now;
      });
      if (upcoming.length) setToastMessage(`Upcoming: ${upcoming[0].name}`);
    }, 60_000);
    return () => clearInterval(interval);
  }, [events]);

  return (
    <div className="relative flex flex-col min-h-screen p-4">
      <div className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(120%_120%_at_0%_100%,#dfe9ff_0%,#ffffff_45%,#efd8d3_100%)]"></div>
      <div className="container max-w-full mx-auto p-4 bg-white rounded-lg border border-gray-200 space-y-6">
        <h1 className="text-2xl font-bold">Staff Event Management</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={filterStatus}
            onValueChange={(value: string) =>
              setFilterStatus(value as EventStatus | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="border-b border-slate-200 bg-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Ended">Ended</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent className="border-b border-slate-200 bg-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Care">Care Event</SelectItem>
              <SelectItem value="Entertainment">Entertainment</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCareType} onValueChange={setFilterCareType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Care Type" />
            </SelectTrigger>
            <SelectContent className="border-b border-slate-200 bg-white">
              <SelectItem value="all">All Care Types</SelectItem>
              <SelectItem value="vital_check">Vital Check</SelectItem>
              <SelectItem value="therapy">Therapy</SelectItem>
              <SelectItem value="hygiene">Hygiene</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col sm:flex-row gap-4 relative bg-white">
            <div
              className="relative cursor-pointer"
              onClick={() => {
                const input = document.getElementById(
                  "filter-from"
                ) as HTMLInputElement;
                input?.showPicker?.();
              }}
            >
              <CalendarIcon
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer z-10"
                onClick={() => {
                  const input = document.getElementById(
                    "filter-from"
                  ) as HTMLInputElement;
                  input?.showPicker?.();
                }}
              />
              <Input
                id="filter-from"
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="pl-8 bg-white"
              />
            </div>

            <div
              className="relative cursor-pointer"
              onClick={() => {
                const input = document.getElementById(
                  "filter-to"
                ) as HTMLInputElement;
                input?.showPicker?.();
              }}
            >
              <CalendarIcon
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer z-10"
                onClick={() => {
                  const input = document.getElementById(
                    "filter-to"
                  ) as HTMLInputElement;
                  input?.showPicker?.();
                }}
              />
              <Input
                id="filter-to"
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="pl-8 bg-white"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <Button
            className="bg-gray-400 text-white hover:bg-gray-600 cursor-pointer"
            onClick={() => {
              setFilterStatus("all");
              setFilterType("all");
              setFilterCareType("all");
              setFilterFrom("");
              setFilterTo("");
            }}
          >
            Clear
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            className="bg-blue-500 text-white hover:bg-blue-500 cursor-pointer hover:opacity-90"
            onClick={() => navigate(path.staffCreateEvent)}
          >
            Add New Event
          </Button>
        </div>

        {/* Events Table */}
        <div className="overflow-visible">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="text-center">Name</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-center">Time</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Rooms</TableHead>
                <TableHead className="text-center">Frequency</TableHead>
                <TableHead className="text-center">Subtype</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow
                  key={event.id}
                  className="hover:bg-transparent border-b border-slate-200"
                >
                  <TableCell className="text-left whitespace-pre-line">
                    {event.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-blue-500 text-white hover:bg-blue-500"
                    >
                      {event.type === "Care"
                        ? event.careSubType || "General"
                        : event.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>
                    {event.startTime} - {event.endTime}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    {event.roomIds && event.roomIds.length > 0
                      ? rooms
                          .filter((r) => event.roomIds?.includes(r.room_id))
                          .map((r) => r.room_number)
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>{event.frequency || "—"}</TableCell>
                  <TableCell>{event.careSubType || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        event.status === "Upcoming"
                          ? "bg-blue-500 text-white hover:bg-blue-500"
                          : event.status === "Ongoing"
                          ? "bg-green-500 text-white hover:bg-green-500"
                          : event.status === "Ended"
                          ? "bg-gray-400 text-white hover:bg-gray-400 "
                          : "bg-red-500 text-white hover:bg-red-500"
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="grid grid-cols-3 ">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border border-slate-200 cursor-pointer hover:bg-blue-500 hover:text-white"
                      onClick={() => openEditDialog(event)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-2 cursor-pointer bg-white border border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Hiển thị {pagination.total === 0 ? 0 : (page - 1) * limit + 1}-
              {Math.min(page * limit, pagination.total)} / {pagination.total} sự
              kiện
            </span>
            <label className="flex items-center gap-2">
              <span className="text-gray-600 whitespace-nowrap">
                Số dòng / trang
              </span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5985d8]"
              >
                {[10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const paginationItems = buildPaginationItems(
                pagination.page,
                pagination.totalPages
              );
              const canGoPrev = pagination.page > 1;
              const canGoNext = pagination.page < pagination.totalPages;

              return (
                <>
                  <button
                    type="button"
                    onClick={() => canGoPrev && setPage(pagination.page - 1)}
                    disabled={!canGoPrev}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer"
                  >
                    Trước
                  </button>
                  {paginationItems.map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`px-3 py-1 rounded border text-sm cursor-pointer ${
                          item === pagination.page
                            ? "bg-[#5985d8] text-white border-[#5985d8]"
                            : "bg-white text-gray-700"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => canGoNext && setPage(pagination.page + 1)}
                    disabled={!canGoNext}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-50 cursor-pointer"
                  >
                    Sau
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Toast for notifications */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded shadow">
            {toastMessage}
          </div>
        )}

        {dialogOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-lg space-y-6">
              <h2 className="text-2xl font-bold text-center">Edit Event</h2>

              <form
                onSubmit={form.handleSubmit(saveUpdateEvent)}
                className="space-y-4"
              >
                {/* 1. NAME */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Name</label>
                  <Input {...form.register("name")} className="flex-1" />
                </div>

                {/* 2. TYPE */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Type</label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(v) => form.setValue("type", v as any)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Care">Care Event</SelectItem>
                      <SelectItem value="Entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2.1 CARE CONFIGURATION (if type=Care) */}
                {form.watch("type") === "Care" && (
                  <>
                    <div className="flex items-center gap-4">
                      <label className="w-36 text-sm font-medium">
                        Subtype
                      </label>
                      <Select
                        value={form.watch("careSubType")}
                        onValueChange={(v) => form.setValue("careSubType", v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose subtype" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VitalCheck">
                            Vital Check
                          </SelectItem>
                          <SelectItem value="Therapy">Therapy</SelectItem>
                          <SelectItem value="MedicationAdmin">
                            Medication Admin
                          </SelectItem>
                          <SelectItem value="Hygiene">Hygiene</SelectItem>
                          <SelectItem value="Meal">Meal</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-36 text-sm font-medium">
                        Frequency
                      </label>
                      <Select
                        value={form.watch("frequency")}
                        onValueChange={(v) => form.setValue("frequency", v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OneTime">One-time</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-36 text-sm font-medium">Rooms</label>
                      <div className="flex-1">
                        <MultiSelect
                          options={rooms.map((room) => ({
                            value: room.room_id,
                            label: `Room ${room.room_number} (${room.type})`,
                          }))}
                          value={rooms
                            .filter((r) =>
                              form.watch("roomIds")?.includes(r.room_id)
                            )
                            .map((r) => ({
                              value: r.room_id,
                              label: `Room ${r.room_number} (${r.type})`,
                            }))}
                          onChange={(selected) =>
                            form.setValue(
                              "roomIds",
                              (selected || []).map((option) => option.value)
                            )
                          }
                          placeholder="Select rooms (optional)..."
                          isMulti
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: "0.5rem",
                              borderColor: "#e2e8f0",
                              minHeight: "40px",
                              fontSize: "0.875rem",
                            }),
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3. DATE */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    {...form.register("date")}
                    className="flex-1"
                  />
                </div>

                {/* 4. TIME */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Time</label>
                  <div className="flex gap-2 flex-1">
                    <Input type="time" {...form.register("startTime")} />
                    <Input type="time" {...form.register("endTime")} />
                  </div>
                </div>

                {/* 5. LOCATION */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Location</label>
                  <Input {...form.register("location")} className="flex-1" />
                </div>

                {/* 6. STATUS */}
                <div className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium">Status</label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as any)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Ongoing" disabled>
                        Ongoing (auto)
                      </SelectItem>
                      <SelectItem value="Ended" disabled>
                        Ended (auto)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-500"
                    type="submit"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function mapEventToStaffEvent(e: EventResponse): StaffEvent {
  console.log("🔄 [mapEventToStaffEvent] Mapping event:", {
    event_id: e.event_id,
    name: e.name,
    start_time: e.start_time,
    end_time: e.end_time,
    status: e.status,
    room_ids: e.room_ids,
    care_configuration: e.care_configuration,
  });

  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  const startTime = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = start.toISOString().split("T")[0];

  const mapped = {
    id: e.event_id,
    name: e.name,
    type: e.type,
    date,
    startTime,
    endTime,
    location: e.location,
    status: e.status, // Status is auto-calculated by backend
    careSubType: e.care_configuration?.subType,
    frequency: e.care_configuration?.frequency,
    roomIds: e.room_ids,
  };

  console.log("✅ [mapEventToStaffEvent] Mapped result:", mapped);
  return mapped;
}

export default StaffEventManagementPage;
