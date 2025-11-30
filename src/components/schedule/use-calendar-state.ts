import React from "react";
import { formatDateLocal } from "./constants";

export function useCalendarState() {
  const [view, setView] = React.useState<"day" | "week">("week");
  const [cursor, setCursor] = React.useState<Date>(new Date());
  const [resident, setResident] = React.useState<string | null>(null);

  const startOfWeek = (d: Date) => {
    const copy = new Date(d);
    const day = (copy.getDay() + 6) % 7; // Mon=0
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const days = React.useMemo(() => {
    if (view === "day") {
      const day = new Date(cursor);
      day.setHours(0, 0, 0, 0);
      return [day];
    }
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start.getTime() + i * 86400000);
      day.setHours(0, 0, 0, 0);
      return day;
    });
  }, [cursor, view]);

  const label = React.useMemo(() => {
    if (view === "day")
      return cursor.toLocaleDateString(undefined, {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    const first = days[0];
    const last = days[6];
    return `${first.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    })} – ${last.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [cursor, view, days]);

  return {
    view,
    setView,
    cursor,
    setCursor,
    days,
    label,
    resident,
    setResident,
  };
}
