import React from "react";
import { TYPES, BODYWORK_GROUP, goalFor, nutrientGoals } from "@/lib/recovery";
import EntryCard from "./EntryCard";

const Dot = ({ color }) => (
  <span
    className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 border-2 rounded-full"
    style={{ backgroundColor: color }}
  />
);

// The four body-map sessions land on one line. Five separate rows for one
// afternoon of treatment reads as five events; it was one.
function BodyWorkRow({ entries, goal, onEdit }) {
  const minutes = entries.reduce((t, e) => t + (+e.data?.minutes || 0), 0);
  return (
    <div className="relative w-full flex items-start gap-2 border-2 rounded-xl bg-card px-2 py-1.5">
      <Dot color={TYPES.mld.color} />
      <span className="w-10 shrink-0 pt-1 font-heading text-[11px] tabular-nums text-muted-foreground">
        {entries[0].entry_time}
      </span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="font-heading text-xs uppercase tracking-wide">Body Work</span>
        <span className="flex flex-wrap gap-1 mt-1">
          {goal && (
            <span className="relative inline-flex items-center overflow-hidden border-2 rounded-full px-2 py-0.5 bg-background">
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.min(100, (minutes / goal) * 100)}%`,
                  backgroundColor: minutes >= goal ? "#12E235" : TYPES.mld.color
                }}
              />
              <span className="relative font-heading text-[10px] whitespace-nowrap text-[#1A1024]">{minutes}m</span>
            </span>
          )}
          {entries.map((e) => {
            const cfg = TYPES[e.type];
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onEdit(e)}
                className="border-2 rounded-full px-2 py-0.5 font-heading text-[10px] whitespace-nowrap"
                style={{ backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" }}
              >
                {cfg.abbr} {e.data?.minutes || 0}m
              </button>
            );
          })}
        </span>
      </span>
    </div>
  );
}

// The day, in order, on a rail. Everything is a row of the same height except
// the ones carrying a list, which is what makes a day scannable at all.
export default function DayFeed({ entries, run, surgery, onEdit }) {
  const bodywork = entries.filter((e) => BODYWORK_GROUP.includes(e.type));
  const rest = entries.filter((e) => !BODYWORK_GROUP.includes(e.type));
  // The folded row sits where the first session was, so the rail stays in order.
  const rows = bodywork.length ? [...rest, { bodywork }] : rest;
  const at = (r) => (r.bodywork ? r.bodywork[0].entry_time : r.entry_time);
  rows.sort((a, b) => String(at(a)).localeCompare(String(at(b))));

  const waterGoal = goalFor(surgery, "water");
  const bodyworkGoal = goalFor(surgery, "bodywork");
  const nutrients = nutrientGoals(surgery);

  return (
    <div className="relative pl-6 flex flex-col gap-1.5">
      <span className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-foreground" />
      {rows.map((r) =>
        r.bodywork ? (
          <BodyWorkRow key="bodywork" entries={r.bodywork} goal={bodyworkGoal} onEdit={onEdit} />
        ) : (
          <EntryCard
            key={r.id}
            entry={r}
            run={run[r.id]}
            goal={r.type === "water" ? waterGoal : null}
            nutrientGoals={nutrients}
            onEdit={() => onEdit(r)}
          />
        )
      )}
    </div>
  );
}
