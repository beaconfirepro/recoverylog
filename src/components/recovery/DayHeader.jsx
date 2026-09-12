import React from "react";
import { parseDate, postOpLabel, fullDate } from "@/lib/dates";
import { isMaintenance, recordLabel } from "@/lib/scope";
import ScopeSwitch from "@/components/recovery/ScopeSwitch";

// The day's heading and the record the day is being read against.
//
// One record in scope: that record's heading — "Post-op day N" for a surgery,
// or the calendar date for maintenance (no pink band, lime accent instead).
// All records: the calendar date, with a chip per record that has something on
// it, each tappable to narrow the view to just that record.
export default function DayHeader({ date, focused, scope, onScope, surgeries, recordsOnDate, onPickRecord }) {
  const d = parseDate(date);
  const weekday = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const multi = recordsOnDate.length > 0;

  return (
    <div className="nb-card p-4 space-y-3">
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