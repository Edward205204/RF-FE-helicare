import React from "react";
import { Button } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { Input } from "@/components/ui";
import { CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import type { ResidentResponse } from "@/apis/resident.api";

type EventTypeFilter = "care" | "visit" | "all";

interface ToolbarProps {
  view: "day" | "week";
  setView: (v: "day" | "week") => void;
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  resident: string | null;
  setResident: (v: string) => void;
  eventTypeFilter?: EventTypeFilter;
  setEventTypeFilter: (v: EventTypeFilter) => void;
  residents: ResidentResponse[];
  className?: string;
  showResidentSelector?: boolean;
}

export function Toolbar({
  view,
  setView,
  label,
  onPrev,
  onNext,
  onToday,
  resident,
  setResident,
  eventTypeFilter,
  setEventTypeFilter,
  residents,
  className = "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
  showResidentSelector = true,
}: ToolbarProps) {
  return (
    <div className={className} style={{ width: "100%", margin: "0 auto" }}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          className="cursor-pointer hover:bg-gray-100 border-none shadow-sm text-black"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          className="cursor-pointer hover:bg-gray-100 border-none shadow-sm text-black"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          onClick={onToday}
          className="cursor-pointer bg-green-500 text-white hover:bg-green-600"
        >
          Hôm nay
        </Button>
        <div className="text-lg font-semibold ml-2">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={view} onValueChange={(v: string) => setView(v as any)}>
          <SelectTrigger className="w-[120px] border-none shadow-sm cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-none shadow-sm">
            <SelectItem value="day">Ngày</SelectItem>
            <SelectItem value="week">Tuần</SelectItem>
          </SelectContent>
        </Select>
        {showResidentSelector && (
        <Select
          value={resident ?? ""}
          onValueChange={(value) => value && setResident(value)}
        >
          <SelectTrigger className="w-[220px] border-none shadow-sm cursor-pointer">
            <SelectValue placeholder="Chọn cư dân" />
          </SelectTrigger>
          <SelectContent className="border-none shadow-sm bg-white">
            {residents.map((r) => (
              <SelectItem key={r.resident_id} value={r.resident_id}>
                {r.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        )}
        <div className="relative">
          <Input placeholder="Tìm kiếm sự kiện..." className="pl-9 w-[220px]" />
          <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>

        <Select
          value={eventTypeFilter ?? "all"}
          onValueChange={(v: string) =>
            setEventTypeFilter(v as EventTypeFilter)
          }
        >
          <SelectTrigger className="w-[150px] flex items-center gap-2 cursor-pointer">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>
              {eventTypeFilter === "care"
                ? "Chăm sóc"
                : eventTypeFilter === "visit"
                ? "Thăm viếng"
                : "Tất cả"}
            </span>
          </SelectTrigger>
          <SelectContent className="border-none shadow-sm bg-white">
            <SelectItem value="care">Chăm sóc</SelectItem>
            <SelectItem value="visit">Thăm viếng</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
