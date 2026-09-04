const DEFAULT_TZ = "America/Toronto";

/**
 * Midnight (00:00) of the given local calendar day, expressed as a UTC Date.
 * Uses the well-known offset trick: accurate outside the ~1h DST transition,
 * which is irrelevant for a weekly counter.
 */
function zonedStartOfDay(year: number, month: number, day: number, tz: string): Date {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const asLocal = new Date(new Date(utcGuess).toLocaleString("en-US", { timeZone: tz }));
  const offset = utcGuess - asLocal.getTime();
  return new Date(utcGuess + offset);
}

/**
 * Start of the current calendar week (Monday 00:00 in `tz`), as a UTC Date.
 * Used to count how many task claims a worker has submitted for a store this week.
 */
export function startOfCurrentWeek(now: Date = new Date(), tz: string = DEFAULT_TZ): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  // en-CA weekday abbreviations: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const daysSinceMonday = (weekdayIndex + 6) % 7;

  const todayStart = zonedStartOfDay(year, month, day, tz);
  return new Date(todayStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
}

/** Start of the current calendar month (1st, 00:00 in `tz`), as a UTC Date. */
export function startOfCurrentMonth(now: Date = new Date(), tz: string = DEFAULT_TZ): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return zonedStartOfDay(Number(get("year")), Number(get("month")), 1, tz);
}

/** Start of "today" (00:00 in `tz`), as a UTC Date. */
export function startOfCurrentDay(now: Date = new Date(), tz: string = DEFAULT_TZ): Date {
  return startOfLocalDay(localDayKey(now, tz), tz);
}

/** Start of the given local day "YYYY-MM-DD" (00:00 in `tz`), as a UTC Date. */
export function startOfLocalDay(dayKey: string, tz: string = DEFAULT_TZ): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return zonedStartOfDay(y, m, d, tz);
}

/** Local calendar day (YYYY-MM-DD in `tz`) for a given instant. */
export function localDayKey(date: Date, tz: string = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
