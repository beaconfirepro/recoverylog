import React from "react";
import { TYPES, gradeColor } from "@/lib/recovery";

const SIGNAL = { warn: "#F7B801", bad: "#E01E37" };

// At most this many pills before the row starts counting the rest. A bad skin
// day is nine findings, which would take a third of the screen unwrapped.
const CAP = 3;

// The row is a coloured plate carrying the time and the tracker, laid across
// the rail, with the entry's pills in a card behind it. The plate overlaps the
// card rather than sitting beside it, so the eye reads the tracker first and
// the pills as belonging to it.
export const PLATE_W = 172;
export const CARD_LEFT = 100;

export function Plate({ time, label, color, darkText }) {
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-between gap-2 h-11 px-3 border-2 rounded-full"
      style={{ width: PLATE_W, backgroundColor: color, color: darkText ? "#1A1024" : "#fff" }}
    >
      <span className="font-heading text-[10px] tabular-nums opacity-80 shrink-0">{time}</span>
      <span className="font-heading text-[10px] uppercase tracking-wide truncate">{label}</span>
    </span>
  );
}

export function Card({ children, corner }) {
  return (
    <span
      className={`relative block min-h-[3.75rem] border-2 rounded-2xl bg-card pb-2 pr-3 ${corner ? "pt-6" : "pt-2"}`}
      style={{ marginLeft: CARD_LEFT, paddingLeft: PLATE_W - CARD_LEFT + 12 }}
    >
      {corner && (
        <span className="absolute top-1.5 right-3 font-heading text-[9px] uppercase tracking-wide text-muted-foreground">
          {corner}
        </span>
      )}
      {children}
    </span>
  );
}

// One pill per cell, two across. A row with a single pill gives it the width,
// which is what makes a lone reading read as the whole answer.
export function Pills({ children, one }) {
  return <span className={`grid gap-2 h-full items-center ${one ? "grid-cols-1" : "grid-cols-2"}`}>{children}</span>;
}

// The whole pill is the goal named in the corner of the card; the fill is the
// day's total up to and including this entry. It fills in the tracker's own
// colour the whole way, because a bar that changes colour at the end reads as a
// different measure rather than as the same one, full.
export function FillPill({ text, done, goal, color }) {
  return (
    <span className="relative flex items-center justify-center overflow-hidden border-2 rounded-full px-3 py-2 bg-background">
      <span
        className="absolute inset-y-0 left-0"
        style={{ width: `${Math.min(100, (done / goal) * 100)}%`, backgroundColor: color }}
      />
      <span className="relative font-heading text-[11px] text-center break-words text-[#1A1024]">{text}</span>
    </span>
  );
}

function Pill({ spec, color, darkText }) {
  if (spec.fill && spec.fill.goal) {
    return <FillPill text={spec.text} done={spec.fill.done} goal={spec.fill.goal} color={color} />;
  }

  const bg =
    spec.tone === "grade" ? gradeColor(spec.grade - 1, 4, spec.highIs) : SIGNAL[spec.tone] || color;
  const dark = spec.tone === "grade" || spec.tone === "warn" || (!spec.tone && darkText);
  return (
    <span
      className="flex items-center justify-center border-2 rounded-full px-3 py-2 font-heading text-[11px] text-center break-words"
      style={{ backgroundColor: bg, color: dark ? "#1A1024" : "#fff" }}
    >
      {spec.text}
    </span>
  );
}

export default function EntryCard({ entry, run, goal, goalLabel, nutrientGoals, onEdit, tag }) {
  const cfg = TYPES[entry.type];
  const specs = cfg.pills(entry.data || {}, entry, run, cfg.goal?.perNutrient ? nutrientGoals : goal);
  const shown = cfg.stacked ? specs.slice(0, CAP) : specs;
  const rest = specs.length - shown.length;
  const count = shown.length + (rest > 0 ? 1 : 0);

  return (
    <button onClick={onEdit} className="relative w-full text-left block transition-transform active:translate-x-[2px]">
      <Card corner={goalLabel}>
        <Pills one={count === 1}>
          {shown.map((s, i) => (
            <Pill key={i} spec={s} color={cfg.color} darkText={cfg.darkText} />
          ))}
          {rest > 0 && (
            <span className="flex items-center justify-center border-2 rounded-full px-3 py-2 font-heading text-[11px] bg-muted text-muted-foreground">
              +{rest} more…
            </span>
          )}
        </Pills>
      </Card>
      <Plate time={entry.entry_time} label={tag ? `${tag} · ${cfg.label}` : cfg.label} color={cfg.color} darkText={cfg.darkText} />
    </button>
  );
}