import React, { useMemo, useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Button } from "@/components/ui";
import { Label } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "react-select";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { toast } from "react-toastify";
import {
  createEvent,
  type CreateEventData,
  type EventType,
  type CareSubType,
  type EventFrequency,
  type CareConfiguration,
} from "@/apis/event.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";
import path from "@/constants/path";

// --- Types & Constants ---
type EventKind = "Care" | "Entertainment" | "Other";
type CareSubTypeLocal =
  | "VitalCheck"
  | "Therapy"
  | "MedicationAdmin"
  | "Hygiene"
  | "Meal"
  | "Other";
type Frequency = "OneTime" | "Daily" | "Weekly" | "Monthly";

const CARE_SUBTYPE_MAP: Record<string, CareSubType> = {
  vital_check: "VitalCheck",
  medication: "MedicationAdmin",
  hygiene: "Hygiene",
  therapy: "Therapy",
  meal: "Meal",
};

const FREQ_MAP: Record<string, EventFrequency> = {
  OneTime: "OneTime",
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
};

export default function StaffCreateEvent(): React.JSX.Element {
  const navigate = useNavigate();

  // --- State Management ---
  const [eventType, setEventType] = useState<EventKind>("Care");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Care-only fields
  const [careSubType, setCareSubType] =
    useState<CareSubTypeLocal>("VitalCheck");
  const [roomIds, setRoomIds] = useState<string[]>([]);
  const [freq, setFreq] = useState<Frequency>("OneTime");
  const [location, setLocation] = useState<string>("");

  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  // --- Refs for UX Improvement (Date Pickers) ---
  const scheduledAtRef = useRef<HTMLInputElement>(null);
  const endAtRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsResponse = await getRooms();
        setRooms(roomsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Cannot load room data");
      }
    };
    fetchData();
  }, []);

  const valid = useMemo(() => {
    if (!scheduledAt || !endAt || !eventName.trim()) return false;
    if (eventType === "Care" && !careSubType) return false;
    return true;
  }, [scheduledAt, endAt, eventType, careSubType, eventName]);

  // --- Submit Handler ---
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startISO = new Date(scheduledAt).toISOString();
      const endISO = new Date(endAt).toISOString();

      const eventData: CreateEventData = {
        name: eventName,
        type: eventType,
        start_time: startISO,
        end_time: endISO,
        location: location || undefined, // Will default to institution name on backend
        room_ids: roomIds.length > 0 ? roomIds : undefined,
      };

      // Add care configuration only for Care events
      if (eventType === "Care") {
        const careConfig: CareConfiguration = {
          subType: CARE_SUBTYPE_MAP[careSubType.toLowerCase()] || "VitalCheck",
          frequency: freq !== "OneTime" ? FREQ_MAP[freq] : undefined,
        };
        eventData.care_configuration = careConfig;
      }

      console.log("📤 [createEvent] Sending event data:", eventData);
      const response = await createEvent(eventData);
      console.log("✅ [createEvent] Event created successfully!");
      console.log("📦 [createEvent] Response:", response);
      console.log("📦 [createEvent] Response.data:", response.data);

      toast.success("Event created successfully!");

      console.log("🧭 [createEvent] Navigating to manage-event with state:", {
        newEvent: response.data,
      });
      navigate(path.staffManageEvent, { state: { newEvent: response.data } });
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(
        error.response?.data?.message ||
          "Cannot create event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen font-sans text-slate-900 bg-gray-50/50">
      {/* --- Background Decoration (Match UI Management) --- */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-50 pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        {/* --- Header --- */}
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-white hover:shadow-sm hover:text-blue-500 transition-all cursor-pointer"
            onClick={() => navigate(path.staffManageEvent)}
          >
            <ArrowLeft className="h-5 w-5  text-inherit" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create New Event
            </h1>
            <p className="text-sm text-slate-500">
              Fill in the details to schedule a care activity or family visit.
            </p>
          </div>
        </div>

        <form
          onSubmit={onCreate}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* --- Left Column: Main Form --- */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. General Info Card */}
            <Card className="rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
                  <CardTitle className="text-lg">General Information</CardTitle>
                </div>
                <CardDescription>
                  Select event type and basic information.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                {/* Event Type */}
                <div className="space-y-2">
                  <Label>Event Type *</Label>
                  <Select
                    value={eventType}
                    onValueChange={(v) => setEventType(v as EventKind)}
                  >
                    <SelectTrigger className="bg-white border-b border-slate-200">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="border-b border-slate-200 bg-white">
                      <SelectItem value="Care">Care Event</SelectItem>
                      <SelectItem value="Entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Name */}
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Morning Yoga, Routine Checkup"
                    className="bg-white border-b border-slate-200"
                  />
                </div>

                {/* Date & Time (Improved UX with useRef) */}
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => scheduledAtRef.current?.showPicker()}
                  >
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors z-10 " />
                    <Input
                      ref={scheduledAtRef}
                      type="datetime-local"
                      className="pl-10 bg-white cursor-pointer hover:border-blue-400 transition-colors border-b border-slate-200"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time *</Label>
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => endAtRef.current?.showPicker()}
                  >
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors z-10" />
                    <Input
                      ref={endAtRef}
                      name="end-datetime"
                      type="datetime-local"
                      className="pl-10 bg-white cursor-pointer hover:border-blue-400 transition-colors border-b border-slate-200"
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                {/* <div className="space-y-2 md:col-span-2">
                  <Label>
                    Location (Optional - defaults to institution name)
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Leave empty to use institution name"
                    className="bg-white border-b border-slate-200"
                  />
                </div> */}
              </CardContent>
            </Card>

            {/* 2. Care Configuration Card (Conditional) */}
            {eventType === "Care" && (
              <Card className="rounded-xl border-gray-200 shadow-sm bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                    <CardTitle className="text-lg">
                      Care Configuration
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Assign staff and set category details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sub-Type *</Label>
                    <Select
                      value={careSubType}
                      onValueChange={(v) =>
                        setCareSubType(v as CareSubTypeLocal)
                      }
                    >
                      <SelectTrigger className="bg-white border-b border-slate-200">
                        <SelectValue placeholder="Select sub-type" />
                      </SelectTrigger>
                      <SelectContent className="border-b border-slate-200 bg-white">
                        <SelectItem value="VitalCheck">
                          Vital Signs Check
                        </SelectItem>
                        <SelectItem value="Therapy">Therapy</SelectItem>
                        <SelectItem value="MedicationAdmin">
                          Medication Management
                        </SelectItem>
                        <SelectItem value="Hygiene">Hygiene</SelectItem>
                        <SelectItem value="Meal">Meal / Nutrition</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={freq}
                      onValueChange={(v) => setFreq(v as Frequency)}
                    >
                      <SelectTrigger className="bg-white border-b border-slate-200">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="border-b border-slate-200 bg-white">
                        <SelectItem value="OneTime">One Time</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Multi-room selection for special care events */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Room (Optional - for special care events)</Label>
                    <MultiSelect
                      options={rooms.map((room) => ({
                        value: room.room_id,
                        label: `Room ${room.room_number} (${room.type})`,
                      }))}
                      value={rooms
                        .filter((r) => roomIds.includes(r.room_id))
                        .map((r) => ({
                          value: r.room_id,
                          label: `Room ${r.room_number} (${r.type})`,
                        }))}
                      onChange={(selected) =>
                        setRoomIds(
                          (selected || []).map((option) => option.value)
                        )
                      }
                      placeholder="Select room (optional)..."
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* --- Right Column: Summary --- */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl border-gray-200 shadow-md bg-white sticky top-24">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                <CardTitle className="text-base font-semibold text-center text-slate-800">
                  Event Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Timeline Visual */}
                <div className="flex gap-3 items-start">
                  <div className="mt-1 bg-blue-100 p-1.5 rounded-md">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">Schedule</p>
                    <p className="text-slate-500">
                      Start:{" "}
                      {scheduledAt
                        ? new Date(scheduledAt).toLocaleString("en-US")
                        : "—"}
                    </p>
                    <p className="text-slate-500">
                      End:{" "}
                      {endAt ? new Date(endAt).toLocaleString("en-US") : "—"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200"></div>

                {/* Details List */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <Badge variant="outline" className="capitalize">
                      {eventType}
                    </Badge>
                  </div>

                  {eventType === "Care" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sub-Type</span>
                        <span className="font-medium">{careSubType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Frequency</span>
                        <span className="font-medium">{freq}</span>
                      </div>
                      {roomIds.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Room</span>
                          <span className="font-medium">
                            Selected {roomIds.length}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {location && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location</span>
                      <span className="font-medium truncate max-w-[120px]">
                        {location}
                      </span>
                    </div>
                  )}
                </div>

                {/* Validation Warning */}
                {!valid && (
                  <div className="flex gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-xs items-start">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Please complete all required fields (Event Type, Event
                      Name, Start Date, End Date
                      {eventType === "Care" ? ", Sub-Type" : ""}).
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    disabled={!valid || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Confirm & Create
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-slate-700"
                    onClick={() => navigate(path.staffManageEvent)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
