import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FamilyVisit, CareEvent } from "@/layouts/staff-layout";
import { useStaffLayoutContext } from "@/layouts/staff-layout";
import MultiSelect from "react-select";
import { createCareLog } from "@/apis/carelog.api";
import { getResidents, type ResidentResponse } from "@/apis/resident.api";
import { toast } from "react-toastify";
import { createSchedule, type CreateScheduleData } from "@/apis/schedule.api";
import {
  createActivity,
  getActivities,
  type ActivityType as ActivityTypeEnum,
} from "@/apis/activity.api";
import { visitApi } from "@/apis/visit";
import { getStaffList, type StaffResponse } from "@/apis/staff.api";
import { getRooms, type RoomResponse } from "@/apis/room.api";

// import { Checkbox } from "../components/ui/checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import path from "@/constants/path";

type EventKind = "care" | "visit";
type CareType = "vital_check" | "medication" | "hygiene" | "therapy" | "meal";
type Frequency = "none" | "daily" | "weekly" | "monthly";

type StaffOption = { id: string; name: string };

// Map care types to activity types
const CARE_TYPE_TO_ACTIVITY_TYPE: Record<CareType, ActivityTypeEnum> = {
  vital_check: "medical_checkup",
  medication: "medical_checkup",
  hygiene: "other",
  therapy: "therapy",
  meal: "meal_time",
};

// Map frequency to schedule frequency
const FREQ_TO_SCHEDULE_FREQ: Record<
  Frequency,
  "daily" | "weekly" | "monthly" | "one_time" | "custom"
> = {
  none: "one_time",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
};

export default function StaffCreateEvent(): React.JSX.Element {
  const navigate = useNavigate();
  const { setCare, setVisits } = useStaffLayoutContext();

  const [kind, setKind] = useState<EventKind>("care");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Care-only fields
  const [careType, setCareType] = useState<CareType>("vital_check");
  const [quantity, setQuantity] = useState<number>(1);
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [roomId, setRoomId] = useState<string>("");
  const [freq, setFreq] = useState<Frequency>("none");
  const [medName, setMedName] = useState<string>("");
  const [medDose, setMedDose] = useState<string>("");

  // Visit-only fields
  const [createQR, setCreateQR] = useState<boolean>(true);
  const [familyUserId, setFamilyUserId] = useState<string>("");
  const [residentId, setResidentId] = useState<string>("");
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  // Check if care type is health-related (needs room selection)
  const isHealthRelated =
    careType === "vital_check" || careType === "medication";

  // Fetch staff and rooms on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffResponse, roomsResponse, residentsResponse] =
          await Promise.all([getStaffList(), getRooms(), getResidents()]);

        const staffList = staffResponse.data || [];
        setStaffOptions(
          staffList.map((s: StaffResponse) => ({
            id: s.user_id,
            name: s.full_name || s.email,
          }))
        );

        setRooms(roomsResponse.data || []);
        setResidents(residentsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load staff/rooms data");
      }
    };
    fetchData();
  }, []);

  const valid = useMemo(() => {
    if (!scheduledAt || !endAt) return false;
    if (kind === "care") {
      if (!assignedStaffIds.length) return false;
      if (!eventName.trim()) return false;
      if (careType === "medication" && (!medName.trim() || !medDose.trim()))
        return false;
      // Room is optional, but if health-related, it's recommended
    } else {
      if (!familyUserId || !residentId) return false;
    }
    return true;
  }, [
    scheduledAt,
    endAt,
    kind,
    assignedStaffIds,
    careType,
    medName,
    medDose,
    familyUserId,
    residentId,
    eventName,
  ]);

  // Helper function to get or create activity
  const getOrCreateActivity = async (
    name: string,
    type: ActivityTypeEnum,
    description?: string
  ): Promise<string> => {
    try {
      // Try to find existing activity
      const activitiesResponse = await getActivities({
        search: name,
        type,
        is_active: true,
        take: 1,
      });

      if (activitiesResponse.data?.activities?.length > 0) {
        return activitiesResponse.data.activities[0].activity_id;
      }

      // Create new activity if not found
      const activityResponse = await createActivity({
        name,
        type,
        description,
        max_participants: quantity || undefined,
      });

      return activityResponse.data.activity_id;
    } catch (error) {
      console.error("Error getting/creating activity:", error);
      throw error;
    }
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startISO = new Date(scheduledAt).toISOString();
      const endISO = new Date(endAt).toISOString();
      const label = new Date(scheduledAt).toLocaleString();

      if (kind === "care") {
        // Map care type to activity type
        const activityType = CARE_TYPE_TO_ACTIVITY_TYPE[careType];
        const activityName =
          eventName || `${careType} - ${new Date().toLocaleDateString()}`;

        // Get or create activity
        const activityId = await getOrCreateActivity(
          activityName,
          activityType,
          notes ||
            `Care event: ${careType}${
              medName ? ` - ${medName} ${medDose}` : ""
            }`
        );

        // Create schedule
        const scheduleData: CreateScheduleData = {
          activity_id: activityId,
          staff_id: assignedStaffIds[0], // Use first staff for now (can be extended to support multiple)
          title: activityName,
          description: notes || undefined,
          start_time: startISO,
          end_time: endISO,
          frequency: FREQ_TO_SCHEDULE_FREQ[freq],
          is_recurring: freq !== "none",
          recurring_until: freq !== "none" && endAt ? endISO : undefined,
          status: "planned",
          notes:
            medName && medDose
              ? `Medication: ${medName} ${medDose}`
              : notes || undefined,
        };

        if (residentId) {
          scheduleData.resident_id = residentId;
        }

        const scheduleResponse = await createSchedule(scheduleData);
        toast.success("Care event created successfully!");

        // Update local state for immediate UI update
        const newEventCare: CareEvent = {
          id: scheduleResponse.data.schedule_id,
          priority,
          datetimeISO: startISO,
          dateISO: startISO.split("T")[0],
          datetimeLabel: label,
          staffName:
            staffOptions
              .filter((s) => assignedStaffIds.includes(s.id))
              .map((s) => s.name)
              .join(", ") || "Staff",
          location: roomId
            ? `Room ${
                rooms.find((r) => r.room_id === roomId)?.room_number || ""
              }`
            : "",
          type: careType,
          eventName: activityName,
          quantity: quantity || 0,
          notes,
        };

        setCare((prev) => [newEventCare, ...prev]);
        navigate(path.staffManageEvent, { state: { newEvent: newEventCare } });
      } else {
        // Family visit - use Visit API
        const visitData = {
          resident_id: residentId,
          visit_date: startISO.split("T")[0],
          visit_time: new Date(scheduledAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          duration: Math.round(
            (new Date(endAt).getTime() - new Date(scheduledAt).getTime()) /
              (1000 * 60)
          ),
          purpose: "Family visit",
          notes: notes || undefined,
        };

        // Note: Visit API is typically called by family members
        // For staff creating visit, we might need a different endpoint
        // For now, we'll create a schedule with social_interaction activity
        const activityId = await getOrCreateActivity(
          "Family Visit",
          "social_interaction",
          `Family visit for resident`
        );

        const scheduleData: CreateScheduleData = {
          activity_id: activityId,
          resident_id: residentId,
          title: "Family Visit",
          description: notes || undefined,
          start_time: startISO,
          end_time: endISO,
          frequency: "one_time",
          is_recurring: false,
          status: "planned",
          notes: notes || undefined,
        };

        const scheduleResponse = await createSchedule(scheduleData);
        toast.success("Family visit scheduled successfully!");

        const newEventVisit: FamilyVisit = {
          id: scheduleResponse.data.schedule_id,
          priority: "Normal",
          resident:
            residents.find((r) => r.resident_id === residentId)?.full_name ||
            "",
          family: familyUserId,
          qr: createQR,
          date: startISO.split("T")[0],
          datetimeISO: startISO,
          datetime: label,
          endDatetime: endISO,
          notes,
        };

        setVisits((prev) => [newEventVisit, ...prev]);
        navigate(path.staffManageEvent, { state: { newEvent: newEventVisit } });
      }
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to create event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full h-full max-w-full overflow-x-hidden bg-white">
      <div className="relative w-full h-full max-w-full p-4 md:p-6 overflow-x-hidden">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl ring-1 ring-gray-200 shadow-lg overflow-hidden flex flex-col">
          <header className="px-6 py-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex-shrink-0 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <ArrowLeft
                  className="h-5 w-5 text-slate-700 cursor-pointer"
                  onClick={() => navigate(path.staffManageEvent)}
                />
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "#5985d8" }}
                  >
                    Create Event
                  </h1>
                  <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form
              onSubmit={onCreate}
              className="grid grid-cols-1 gap-6 lg:grid-cols-3"
            >
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Event details</CardTitle>
                    <CardDescription>
                      Choose type and fill required information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {/* event kind  */}
                    <div className="flex flex-col gap-1">
                      <Label>Event kind</Label>
                      <Select
                        value={kind}
                        onValueChange={(v) => setKind(v as EventKind)}
                      >
                        <SelectTrigger className="border border-gray-200 bg-white">
                          <SelectValue placeholder="Select kind" />
                        </SelectTrigger>
                        <SelectContent className="border border-gray-200 bg-white">
                          <SelectItem value="care">Care event</SelectItem>
                          <SelectItem value="visit">Family visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* quantity */}
                    {kind === "care" && (
                      <div className="flex flex-col gap-1">
                        <Label>Quantity (Maximum) *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={quantity === 0 ? "" : String(quantity)}
                          onChange={(e) =>
                            setQuantity(Number(e.target.value) || 0)
                          }
                          onBlur={() => setQuantity(quantity || 1)}
                          placeholder="Enter quantity"
                          className="appearance-none border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Resident selection only for visit */}
                    {kind === "visit" && (
                      <div className="flex flex-col gap-1">
                        <Label>Resident *</Label>
                        <Select
                          value={residentId}
                          onValueChange={setResidentId}
                        >
                          <SelectTrigger className="border border-gray-200 bg-white">
                            <SelectValue placeholder="Select resident" />
                          </SelectTrigger>
                          <SelectContent className="border border-gray-200 bg-white">
                            {residents.map((r) => (
                              <SelectItem
                                key={r.resident_id}
                                value={r.resident_id}
                              >
                                {r.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Hide event name field when family name is selected */}
                    {kind !== "visit" && (
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <Label>Event name *</Label>
                        <Input
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          placeholder="Enter event name"
                          className="border border-gray-200"
                        />
                      </div>
                    )}

                    {/* from - to */}
                    <div className="flex flex-col gap-1">
                      <Label>Date & time *</Label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer"
                          onClick={() => {
                            const input = document.querySelector(
                              'input[type="datetime-local"]'
                            ) as HTMLInputElement;
                            if (
                              input &&
                              typeof input.showPicker === "function"
                            ) {
                              input.showPicker();
                            } else {
                              alert("Please manually select a date and time.");
                            }
                          }}
                        />
                        <Input
                          type="datetime-local"
                          className="pl-8 border border-gray-200"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label>End Date & time *</Label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer"
                          onClick={() => {
                            const input = document.querySelector(
                              'input[name="end-datetime"]'
                            ) as HTMLInputElement;
                            if (
                              input &&
                              typeof input.showPicker === "function"
                            ) {
                              input.showPicker();
                            } else {
                              alert(
                                "Please manually select an end date and time."
                              );
                            }
                          }}
                        />
                        <Input
                          name="end-datetime"
                          type="datetime-local"
                          className="pl-8 border border-gray-200"
                          value={endAt}
                          onChange={(e) => setEndAt(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 4: Notes */}
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Extra notes…"
                        className="border border-gray-200"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* CARE-only block */}
                {kind === "care" && (
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Care configuration</CardTitle>
                      <CardDescription>
                        Assign staff, location, frequency…
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label>Care type</Label>
                        <Select
                          value={careType}
                          onValueChange={(v) => setCareType(v as CareType)}
                        >
                          <SelectTrigger className="border border-gray-200 bg-white">
                            <SelectValue placeholder="Select care type" />
                          </SelectTrigger>
                          <SelectContent className="border border-gray-200 bg-white">
                            <SelectItem value="vital_check">
                              Vital check
                            </SelectItem>
                            <SelectItem value="medication">
                              Medication
                            </SelectItem>
                            <SelectItem value="hygiene">Hygiene</SelectItem>
                            <SelectItem value="therapy">Therapy</SelectItem>
                            <SelectItem value="meal">
                              Meal / Nutrition
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label>Assigned staff *</Label>
                        <MultiSelect
                          options={staffOptions.map((s) => ({
                            value: s.id,
                            label: s.name,
                          }))}
                          value={staffOptions
                            .filter((s) => assignedStaffIds.includes(s.id))
                            .map((s) => ({ value: s.id, label: s.name }))}
                          onChange={(selected) =>
                            setAssignedStaffIds(
                              (selected || []).map((option) => option.value)
                            )
                          }
                          placeholder="Select staff"
                          isMulti
                        />
                      </div>

                      {/* Room selection for health-related care events */}
                      {isHealthRelated && (
                        <div className="flex flex-col gap-1">
                          <Label>Room (Optional)</Label>
                          <Select
                            value={roomId || "none"}
                            onValueChange={(v) =>
                              setRoomId(v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="border border-gray-200 bg-white">
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent className="border border-gray-200 bg-white">
                              <SelectItem value="none">None</SelectItem>
                              {rooms.map((room) => (
                                <SelectItem
                                  key={room.room_id}
                                  value={room.room_id}
                                >
                                  Room {room.room_number} ({room.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <Label>Priority</Label>
                        <Select
                          value={priority}
                          onValueChange={(v) => setPriority(v as any)}
                        >
                          <SelectTrigger className="border border-gray-200 bg-white">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent className="border border-gray-200 bg-white">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label>Repeat</Label>
                        <Select
                          value={freq}
                          onValueChange={(v) => setFreq(v as Frequency)}
                        >
                          <SelectTrigger className="border border-gray-200 bg-white">
                            <SelectValue placeholder="No repeat" />
                          </SelectTrigger>
                          <SelectContent className="border border-gray-200 bg-white">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Medication extras */}
                      {careType === "medication" && (
                        <>
                          <div className="flex flex-col gap-1">
                            <Label>Medication name *</Label>
                            <Input
                              value={medName}
                              onChange={(e) => setMedName(e.target.value)}
                              placeholder="Amlodipine"
                              className="border border-gray-200"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label>Dose *</Label>
                            <Input
                              value={medDose}
                              onChange={(e) => setMedDose(e.target.value)}
                              placeholder="5 mg"
                              className="border border-gray-200"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
                {/* FAMILY VISIT */}
                {kind === "visit" && (
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Family visit</CardTitle>
                      <CardDescription>
                        QR will be used for check-in if enabled
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-1 md:col-span-1">
                        <Label>Family user ID *</Label>
                        <Input
                          type="text"
                          value={familyUserId}
                          onChange={(e) => setFamilyUserId(e.target.value)}
                          placeholder="Enter family user ID"
                          className="border border-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the family member's user ID who will visit
                        </p>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border px-3 py-2 md:col-span-1">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="text-sm font-medium">
                              Generate QR for check-in
                            </p>
                            <p className="text-xs text-slate-500">
                              QR code for family with the schedule.
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          checked={createQR}
                          onCheckedChange={(v) => setCreateQR(v === true)}
                          className="
                                                                h-5 w-5 rounded-full border border-gray-300 bg-white
                                                                data-[state=checked]:bg-black data-[state=checked]:border-black
                                                                data-[state=checked]:text-white
                                                                [&>svg]:h-3 [&>svg]:w-3
                                                            "
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column – Summary & Actions */}
              <div className="lg:col-span-1 text-left">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base text-center">
                      Summary
                    </CardTitle>
                    <CardDescription className="text-center">
                      Quick review before creating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p>
                        <span className="text-left text-slate-500">Kind:</span>{" "}
                        <span className="font-medium">{kind}</span>
                      </p>
                      <p className="flex items-left gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        {scheduledAt
                          ? new Date(scheduledAt).toLocaleString()
                          : "—"}
                      </p>
                      {kind === "care" && (
                        <>
                          <p>
                            <span className="text-left text-slate-500">
                              Event Name:
                            </span>{" "}
                            {eventName || "—"}
                          </p>
                          <p>
                            <span className="text-left text-slate-500">
                              Quantity:
                            </span>{" "}
                            {quantity || "—"}
                          </p>
                          <p>
                            <span className="text-left text-slate-500">
                              Care type:
                            </span>{" "}
                            {careType}
                          </p>
                          <p>
                            <span className="text-left text-slate-500">
                              Staff:
                            </span>{" "}
                            {staffOptions
                              .filter((s) => assignedStaffIds.includes(s.id))
                              .map((s) => s.name)
                              .join(", ") || "Not selected"}
                          </p>
                          {roomId && (
                            <p>
                              <span className="text-left text-slate-500">
                                Room:
                              </span>{" "}
                              {rooms.find((r) => r.room_id === roomId)
                                ?.room_number || "N/A"}
                            </p>
                          )}
                          <div className="flex items-left gap-2 mt-1">
                            <Badge variant="secondary">
                              Priority: {priority}
                            </Badge>
                            {freq !== "none" && (
                              <Badge variant="outline">Repeat</Badge>
                            )}
                          </div>
                        </>
                      )}
                      {kind === "visit" && (
                        <>
                          <p>
                            <span className="text-slate-500">Resident:</span>{" "}
                            {familyUserId ?? "—"}
                          </p>
                          <p>
                            <span className="text-slate-500">Family:</span>{" "}
                            {familyUserId ?? "—"}
                          </p>
                          <p>
                            <span className="text-slate-500">QR:</span>{" "}
                            {createQR ? "Yes" : "No"}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="w-1/2">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="w-1/2"
                        style={{
                          backgroundColor: "#5985d8",
                          color: "white",
                        }}
                        disabled={!valid || isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create"}
                      </Button>
                    </div>
                    {!valid && (
                      <p className="text-xs text-amber-600">
                        Fill required fields (time,{" "}
                        {kind === "care" ? "assigned staff" : "family user"}
                        …)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
