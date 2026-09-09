import { useMemo, useState } from "react";
import { useStreakHistory } from "../../hooks/useEngagement";
import type { StreakDay } from "../../types";

type Zoom = "week" | "month" | "year";

const ZOOMS: { key: Zoom; label: string }[] = [
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Parse "YYYY-MM-DD" to a local-midnight Date (avoids UTC-parse day drift). */
const parseKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

function periodRange(zoom: Zoom, anchor: Date): { from: string; to: string } {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (zoom === "week") {
    const mon = new Date(a);
    mon.setDate(a.getDate() - ((a.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: ymd(mon), to: ymd(sun) };
  }
  if (zoom === "month") {
    return {
      from: ymd(new Date(a.getFullYear(), a.getMonth(), 1)),
      to: ymd(new Date(a.getFullYear(), a.getMonth() + 1, 0)),
    };
  }
  return { from: ymd(new Date(a.getFullYear(), 0, 1)), to: ymd(new Date(a.getFullYear(), 11, 31)) };
}

function shiftAnchor(zoom: Zoom, anchor: Date, dir: -1 | 1): Date {
  const a = new Date(anchor);
  if (zoom === "week") a.setDate(a.getDate() + dir * 7);
  else if (zoom === "month") a.setMonth(a.getMonth() + dir);
  else a.setFullYear(a.getFullYear() + dir);
  return a;
}

function periodLabel(zoom: Zoom, anchor: Date): string {
  if (zoom === "year") return String(anchor.getFullYear());
  if (zoom === "month")
    return anchor.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
  const { from, to } = periodRange("week", anchor);
  return `${from.slice(5).replace("-", "/")} → ${to.slice(5).replace("-", "/")}`;
}

function Flame({ lit }: { lit: boolean }) {
  return (
    <span className={lit ? "" : "opacity-30 grayscale"} aria-hidden="true">
      🔥
    </span>
  );
}

const HEAT = ["bg-canvas-100", "bg-linen-200", "bg-linen-300", "bg-linen-400", "bg-linen-500"];
const heatClass = (count: number) => HEAT[Math.min(count, HEAT.length - 1)];

function DayCell({
  day,
  today,
  selected,
  onSelect,
}: {
  day: StreakDay;
  today: string;
  selected: string | null;
  onSelect: (k: string) => void;
}) {
  const num = day.date.slice(8).replace(/^0/, "");
  return (
    <button
      type="button"
      onClick={() => onSelect(day.date)}
      title={`${day.date} · ${day.count} tâche${day.count === 1 ? "" : "s"}`}
      className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] transition-colors ${
        day.date === selected
          ? "bg-flow-50 ring-1 ring-flow-300"
          : "hover:bg-canvas-50"
      }`}
    >
      <Flame lit={day.done} />
      <span className={day.date === today ? "font-semibold text-flow-700" : "text-canvas-400"}>
        {day.date === today ? "auj." : num}
      </span>
    </button>
  );
}

export function StreakHistory({
  workerId = null,
  selected,
  onSelect,
}: {
  workerId?: string | null;
  selected: string | null;
  onSelect: (dayKey: string) => void;
}) {
  const [zoom, setZoom] = useState<Zoom>("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const range = useMemo(() => periodRange(zoom, anchor), [zoom, anchor]);
  const { data, isFetching } = useStreakHistory(workerId, range);
  const days = data?.days ?? [];
  const today = ymd(new Date());
  const atToday = ymd(anchor) === today || periodRange(zoom, new Date()).from === range.from;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAnchor((a) => shiftAnchor(zoom, a, -1))}
            className="rounded-lg px-2 py-1 text-sm text-canvas-600 hover:bg-canvas-100"
          >
            ◀
          </button>
          <span className="min-w-[8rem] text-center text-sm font-medium text-canvas-800">
            {periodLabel(zoom, anchor)}
          </span>
          <button
            type="button"
            disabled={atToday}
            onClick={() => setAnchor((a) => shiftAnchor(zoom, a, 1))}
            className="rounded-lg px-2 py-1 text-sm text-canvas-600 hover:bg-canvas-100 disabled:opacity-30"
          >
            ▶
          </button>
          {!atToday && (
            <button
              type="button"
              onClick={() => setAnchor(new Date())}
              className="ml-1 rounded-full bg-canvas-100 px-2 py-0.5 text-xs font-medium text-canvas-700 hover:bg-canvas-200"
            >
              Aujourd'hui
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {ZOOMS.map((z) => (
            <button
              key={z.key}
              type="button"
              onClick={() => setZoom(z.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                zoom === z.key ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-3 ${isFetching ? "opacity-60" : ""}`}>
        {zoom === "week" && (
          <div className="flex justify-between gap-1.5">
            {days.map((d) => (
              <div key={d.date} className="flex-1">
                <p className="text-center text-[11px] font-medium text-canvas-500">{d.label}</p>
                <DayCell day={d} today={today} selected={selected} onSelect={onSelect} />
              </div>
            ))}
          </div>
        )}

        {zoom === "month" && <MonthGrid days={days} today={today} selected={selected} onSelect={onSelect} />}

        {zoom === "year" && <YearHeatmap days={days} today={today} selected={selected} onSelect={onSelect} />}
      </div>
    </div>
  );
}

function MonthGrid({
  days,
  today,
  selected,
  onSelect,
}: {
  days: StreakDay[];
  today: string;
  selected: string | null;
  onSelect: (k: string) => void;
}) {
  if (days.length === 0) return null;
  const lead = (parseKey(days[0].date).getDay() + 6) % 7; // Mon=0
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-canvas-500">
        {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {days.map((d) => (
          <DayCell key={d.date} day={d} today={today} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function YearHeatmap({
  days,
  today,
  selected,
  onSelect,
}: {
  days: StreakDay[];
  today: string;
  selected: string | null;
  onSelect: (k: string) => void;
}) {
  if (days.length === 0) return null;
  const first = parseKey(days[0].date);
  const firstMon = new Date(first);
  firstMon.setDate(first.getDate() - ((first.getDay() + 6) % 7));

  const cells = days.map((d) => {
    const dt = parseKey(d.date);
    const col = Math.floor((dt.getTime() - firstMon.getTime()) / (7 * 86_400_000));
    const row = (dt.getDay() + 6) % 7; // Mon=0
    return { d, col, row };
  });
  const cols = Math.max(...cells.map((c) => c.col)) + 1;

  // month label positions (first cell of each month)
  const monthMarks: { col: number; label: string }[] = [];
  let lastMonth = -1;
  for (const { d, col } of cells) {
    const mo = parseKey(d.date).getMonth();
    if (mo !== lastMonth) {
      monthMarks.push({ col, label: parseKey(d.date).toLocaleDateString("fr-CA", { month: "short" }) });
      lastMonth = mo;
    }
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block">
        <div
          className="grid text-[9px] text-canvas-500"
          style={{ gridTemplateColumns: `repeat(${cols}, 13px)` }}
        >
          {monthMarks.map((m) => (
            <span key={m.col} style={{ gridColumnStart: m.col + 1 }} className="pb-0.5">
              {m.label}
            </span>
          ))}
        </div>
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${cols}, 13px)`,
            gridTemplateRows: "repeat(7, 13px)",
          }}
        >
          {cells.map(({ d, col, row }) => (
            <button
              key={d.date}
              type="button"
              onClick={() => onSelect(d.date)}
              title={`${d.date} · ${d.count} tâche${d.count === 1 ? "" : "s"}`}
              style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
              className={`h-[13px] w-[13px] rounded-[3px] ${heatClass(d.count)} ${
                d.date === selected
                  ? "ring-2 ring-flow-500"
                  : d.date === today
                    ? "ring-1 ring-flow-400"
                    : ""
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-canvas-500">
          <span>moins</span>
          {HEAT.map((c) => (
            <span key={c} className={`h-[11px] w-[11px] rounded-[3px] ${c}`} />
          ))}
          <span>plus</span>
        </div>
      </div>
    </div>
  );
}
