import React from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui";
import { Clock, Users } from "lucide-react";
import type { ResidentResponse } from "@/apis/resident.api";
import { ResidentCombobox } from "./resident-combobox";
import { toMinutes } from "./constants";

interface Event {
  id: string;
  date: string;
  start?: string;
  end?: string;
  name: string;
  type: "care" | "visit";
  location: string;
  staff: string;
  capacity: number;
  registered: number;
  note: string;
}

interface EventBlockProps {
  ev: Event;
  residents?: ResidentResponse[];
}

export function EventBlock({ ev, residents = [] }: EventBlockProps) {
  const SLOT_PX = 80;
  const PX_PER_MIN = SLOT_PX / 60;
  const CAL_START = 8 * 60; // 08:00
  const CAL_END = 20 * 60;

  const startMin = toMinutes(ev.start || "08:00");
  const endMin = toMinutes(ev.end || "09:00");

  const startOffset = startMin - CAL_START; // 08–20h
  const durMin = Math.max(0, endMin - startMin);

  if (startMin < CAL_START || startMin >= CAL_END) {
    return null;
  }

  const top = startOffset * PX_PER_MIN;
  const height = Math.max(36, durMin * PX_PER_MIN);

  const [mine, setMine] = React.useState(false);
  const [count, setCount] = React.useState(ev.registered);
  const [selectedResident, setSelectedResident] = React.useState<string | null>(
    null
  );

  const full = count >= ev.capacity;
  const remaining = Math.max(ev.capacity - count, 0);

  const color =
    ev.type === "visit"
      ? "bg-amber-50 ring-amber-200"
      : "bg-sky-50 ring-sky-200";

  const canRegister =
    ev.type === "visit" ? !!selectedResident && !mine && !full : !mine && !full;

  const onRegister = () => {
    if (!canRegister) return;
    setMine(true);
    setCount((c) => Math.min(ev.capacity, c + 1));
  };
  const onCancel = () => {
    if (!mine) return;
    setMine(false);
    setCount((c) => Math.max(0, c - 1));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`absolute left-1 right-1 rounded-xl ring-1 text-left p-2 shadow-sm hover:shadow ${color} z-20`}
          style={{ top, height }}
        >
          <div className="flex flex-col items-start justify-between">
            <div className="font-medium text-sm truncate">{ev.name}</div>
            <Badge variant={full ? "destructive" : "secondary"}>
              <Users className="h-3.5 w-3.5 mr-1" />
              {count}/{ev.capacity}
            </Badge>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <Card className="shadow-none border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {ev.name}
              <Badge variant="outline">{ev.type}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4" /> {ev.start}–{ev.end}
            </div>
            <div className="text-slate-600">Loc: {ev.location}</div>
            <div className="text-slate-600">Staff: {ev.staff}</div>
            <div className="text-slate-600">
              Note: {ev.note || "No notes available"}
            </div>

            <div className="flex flex-col items-start gap-1">
              <Badge variant="secondary">
                <Users className="h-3.5 w-3.5 mr-1" />
                {count}/{ev.capacity}
              </Badge>
              {full ? (
                <Badge variant="destructive">Full</Badge>
              ) : (
                <span className="text-slate-500 text-xs">
                  Remaining: <b>{remaining}</b>
                </span>
              )}
            </div>

            {ev.type === "visit" && (
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Resident</div>
                <ResidentCombobox
                  value={selectedResident}
                  onChange={setSelectedResident}
                  options={residents.map((r) => ({
                    id: r.resident_id,
                    name: r.full_name,
                  }))}
                  placeholder="Select resident…"
                />
              </div>
            )}

            <div className="pt-1 flex gap-2">
              <Button
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                onClick={onRegister}
                disabled={!canRegister}
              >
                {mine ? "Registered" : "Register"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={!mine}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
