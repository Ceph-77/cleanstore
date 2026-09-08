const DEFAULT_TZ = "America/Toronto";

/**
 * Milliseconds that `tz` is ahead of UTC at `instant` (negative for the
 * Americas). Reads the wall clock via Intl parts, so it is independent of the
 * host machine's own timezone — unlike parsing a `toLocaleString()` string,
 * which the previous implementation did and which only worked on a UTC host.
 */
function tzOffsetMs(instant: number, tz: string): number {
  const p: Record<string, number> = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant))) {
    if (type !== "literal") p[type] = Number(value);
  }
  const asUtc = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!);
  return asUtc - instant;
}

/**
 * Midnight (00:00) of the given local calendar day in `tz`, as a UTC Date.
 * Correct on any host timezone. The second offset read resolves the ~1h
 * ambiguity when the requested day is itself a DST-transition day.
 */
function zonedStartOfDay(year: number, month: number, day: number, tz: string): Date {
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const o1 = tzOffsetMs(guess, tz);
  const t1 = guess - o1;
  const o2 = tzOffsetMs(t1, tz);
  return new Date(o1 === o2 ? t1 : guess - o2);
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

  // Walk back to Monday's calendar date with plain UTC-date arithmetic (no DST),
  // then take that day's local midnight — so a week straddling a DST change is
  // still anchored exactly at 00:00 local, not 01:00.
  const monday = new Date(Date.UTC(year, month - 1, day) - daysSinceMonday * 86_400_000);
  return zonedStartOfDay(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), tz);
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
