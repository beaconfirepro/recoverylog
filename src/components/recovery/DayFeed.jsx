import React from "react";
import { TYPES, BODYWORK_GROUP, checkinConfig, gradeColor, goalFor, nutrientGoals } from "@/lib/recovery";
import EntryCard, { Card, Pills, Plate } from "./EntryCard";

// The check-in is the one entry that is not a pill. It records six things at
// once, and a day is read by comparing them, so it keeps its grid rather than
// being folded down to the slot it was taken in.
function CheckinCard({ entry, cfg, onEdit }) {
  const d = entry.data || {};
  const measures = cfg.fields.filter((f) => f.kind === "scale");
  const high = measures.filter((f) => f.highIs === "good");
  const low = measures.filter((f) => f.highIs === "bad");
  const rows = Math.max(high.length, low.length);

  const bar = (f) =>
    f && d[f.key] != null ? (
      <span
        key={f.key}
        className="relative flex items-center overflow-hidden border-2 rounded-full px-2 py-1 bg-background"
      >
        <span
          className="absolute inset-y-0 left-0"
          style={{ width: `${(d[f.key] / 10) * 100}%`, backgroundColor: gradeColor(d[f.key], 10, f.highIs) }}
        />
        <span className="relative font-heading text-[10px] whitespace-nowrap text-[#1A1024]">
          {f.label} {d[f.key]}
        </span>
      </span>
    ) : (
      <span key={f?.key || Math.random()} />
    );

  return (
    <button onClick={onEdit} className="relative w-full text-left block transition-transform active:translate-x-[2px]">
      <Card corner={d.slot}>
        <span className="grid grid-cols-2 gap-x-2 gap-y-1">
          <span className="font-heading text-[9px] uppercase tracking-wide text-muted-foreground">Aim high</span>
          <span className="font-heading text-[9px] uppercase tracking-wide text-muted-foreground">Aim low</span>
          {Array.from({ length: rows }, (_, i) => [bar(high[i]), bar(low[i])]).flat()}
        </span>
      </Card>
      <Plate time={entry.entry_time} label={cfg.label} color={cfg.color} />
    </button>
  );
}

// The four body-map sessions land on one line. Five separate rows for one
// afternoon of treatment reads as five events; it was one.
function BodyWorkRow({ entries, goal, onEdit }) {
  const minutes = entries.reduce((t, e) => t + (+e.data?.minutes || 0), 0);
  return (
    <div className="relative">
      <Card corner={goal ? `${minutes}m of ${goal} min` : `${minutes}m`}>
        <Pills one={entries.length === 1}>
          {entries.map((e) => {
            const cfg = TYPES[e.type];
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onEdit(e)}
                className="flex items-center justify-center border-2 rounded-full px-3 py-2 font-heading text-xs"
                style={{ backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" }}
              >
                {cfg.abbr} {e.data?.minutes || 0}m
              </button>
            );
          })}
        </Pills>
      </Card>
      <Plate time={entries[0].entry_time} label="Body Work" color={TYPES.mld.color} />
    </div>
  );
}

// The day, in order, on a rail. Each entry is a coloured plate laid across the
// rail with its pills in a card behind it.
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
  const checkin = checkinConfig(surgery);

  return (
    <div className="relative flex flex-col gap-2.5">
      {/* Behind the plates, which is what makes them read as pinned to it. */}
      <span className="absolute left-[46px] top-2 bottom-2 w-0.5 bg-foreground" />
      {rows.map((r) =>
        r.bodywork ? (
          <BodyWorkRow key="bodywork" entries={r.bodywork} goal={bodyworkGoal} onEdit={onEdit} />
        ) : r.type === "checkin" ? (
          <CheckinCard key={r.id} entry={r} cfg={checkin} onEdit={() => onEdit(r)} />
        ) : (
          <EntryCard
            key={r.id}
            entry={r}
            run={run[r.id]}
            goal={r.type === "water" ? waterGoal : null}
            goalLabel={r.type === "water" && waterGoal ? `Goal: ${waterGoal} oz` : null}
            nutrientGoals={nutrients}
            onEdit={() => onEdit(r)}
          />
        )
      )}
    </div>
  );
}
