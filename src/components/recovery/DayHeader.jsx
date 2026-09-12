import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, niceDate, parseDate, postOpLabel, fullDate, todayStr } from "@/lib/dates";
import { isMaintenance, recordLabel } from "@/lib/scope";
import ScopeSwitch from "@/components/recovery/ScopeSwitch";
import JumpToDate from "@/components/recovery/JumpToDate";

// The day's heading, how you get to another day, and the record the day is
// being read against.
//
// One record in scope: that record's heading — "Post-op day N" for a surgery,
// or the calendar date for maintenance (no pink band, lime accent instead).
// All records: the calendar date, with a chip per record that has something on
// it, each tappable to narrow the view to just that record.
export default function DayHeader({ date, focused, scope, onScope, surgeries, recordsOnDate, onPickRecord }) {
  const d = parseDate(date);
  const weekday = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const multi = recordsOnDate.length > 0;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const today = todayStr();
  const isToday = date === today;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  // Nothing to log in the future, and a post-op count on a day that has not
  // happened reads as a prediction rather than a record.
  const canGoForward = next <= today;

  // Walking back a fortnight should not leave a fortnight of days stacked
  // behind the browser's back gesture, so a day replaces a day. Arriving from
  // Today is different: that is the tab root and it has to stay underneath.
  const openDay = (target) => {
    const onDayPage = pathname.startsWith("/day/");
    if (target === today) navigate("/", { replace: onDayPage });
    else navigate(`/day/${target}`, { replace: onDayPage });
  };

  return (
    <div className="nb-card p-4 space-y-3">
      {/* In the installed app there is no browser chrome and no edge-swipe, so
          without this the only way out of a past day is a tab, which lands on
          Today rather than back in the list she came from. */}
      {!isToday && (
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="flex items-center gap-1 -ml-1 font-heading text-xs uppercase tracking-wider text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Day by Day
        </button>
      )}

      <div className="min-w-0">
        {multi ? (
          <>
            <h1 className="font-display text-2xl leading-none uppercase break-words">{fullDate(date)}</h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">{weekday}</p>
          </>
        ) : focused && isMaintenance(focused) ? (
          <>
            <h1 className="font-display text-3xl leading-none uppercase break-words" style={{ color: "hsl(var(--accent-foreground))" }}>
              {fullDate(date)}
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              {weekday} · Maintenance log
            </p>
          </>
        ) : focused?.surgery_date ? (
          <>
            <h1 className="font-display text-3xl leading-none uppercase break-words">
              {postOpLabel(focused.surgery_date, date) || "Surgery"}
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">{weekday}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl leading-none uppercase break-words">{fullDate(date)}</h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              {weekday} · {recordLabel(focused)}
            </p>
          </>
        )}
      </div>

      {/* A day you logged nothing on has no card in Day by Day, so walking back
          from Today is how you reach it. The day row is created when the page
          opens, so the empty day takes an entry as soon as it is on screen. */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => openDay(prev)}
          aria-label={`Previous day, ${niceDate(prev)}`}
          className="nb-btn flex-1 h-11 px-2 bg-card text-xs"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Previous day
        </button>
        <button
          type="button"
          onClick={() => openDay(next)}
          disabled={!canGoForward}
          aria-label={canGoForward ? `Next day, ${niceDate(next)}` : "Next day — today is the last day"}
          className="nb-btn flex-1 h-11 px-2 bg-card text-xs disabled:opacity-40"
        >
          Next day
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      <JumpToDate value={date} />

      <ScopeSwitch surgeries={surgeries} scope={scope} onScope={onScope} />

      {multi && (
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {recordsOnDate.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onPickRecord(r.id)}
              className="nb-chip px-2.5 py-1 text-xs"
              style={
                isMaintenance(r)
                  ? { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }
                  : { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }
              }
            >
              {recordLabel(r)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
