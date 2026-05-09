import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export function fmtDate(d: string | Date | null | undefined, fmt = "d MMM yyyy"): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, fmt);
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "d MMM, h:mm a");
}

export function fmtRelative(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function rangeFor(period: "today" | "this_week" | "last_7d") {
  const now = new Date();
  if (period === "today") {
    return { start: startOfDay(now), end: endOfDay(now) };
  }
  if (period === "this_week") {
    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }
  return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
}

export function priorRange(period: "today" | "this_week" | "last_7d") {
  const now = new Date();
  if (period === "today") {
    const y = subDays(now, 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (period === "this_week") {
    const lastWeekRef = subDays(now, 7);
    return {
      start: startOfWeek(lastWeekRef, { weekStartsOn: 1 }),
      end: endOfWeek(lastWeekRef, { weekStartsOn: 1 }),
    };
  }
  return { start: startOfDay(subDays(now, 13)), end: endOfDay(subDays(now, 7)) };
}
