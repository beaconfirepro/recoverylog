import React from "react";
import { TYPES, gradeColor } from "@/lib/recovery";

const SIGNAL = { warn: "#F7B801", bad: "#E01E37" };

// At most this many pills before the row starts counting the rest. A bad skin
// day is nine findings, which would take a third of the screen unwrapped.
const CAP = 3;

function Pill({ spec, color, darkText }) {
  if (spec.fill && spec.fill.goal) {
    // The number is this entry; the bar behind it is the day so far against the
    // goal, which is the only place the day's total appears on a card. It fills
    // in the tracker's own colour the whole way: a bar that changes colour at
    // the end reads as a different measure rather than as the same one, full.
    const { done, goal } = spec.fill;
    return (
      <span className="relative inline-flex items-center overflow-hidden border-2 rounded-full px-2 py-0.5 bg-background">
        <span
          className="absolute inset-y-0 left-0"
          style={{ width: `${Math.min(100, (done / goal) * 100)}%`, backgroundColor: color }}
        />
        <span className="relative font-heading text-[10px] whitespace-nowrap text-[#1A1024]">{spec.text}</span>
      </span>
    );
  }

  const bg =
    spec.tone === "grade" ? gradeColor(spec.grade - 1, 4, spec.highIs) : SIGNAL[spec.tone] || color;
  const dark = spec.tone === "grade" || spec.tone === "warn" || (!spec.tone && darkText);
  return (
    <span
      className="inline-block border-2 rounded-full px-2 py-0.5 font-heading text-[10px] whitespace-nowrap"
      style={{ backgroundColor: bg, color: dark ? "#1A1024" : "#fff" }}
    >
      {spec.text}
    </span>
  );
}

// One entry, one line: the time, the tracker, and pills that say what it was.
// A tracker whose pills are a list (skin findings, nutrients) puts its name on
// its own line so a long list wraps underneath instead of squeezing it out.
export default function EntryCard({ entry, run, goal, nutrientGoals, onEdit }) {
  const cfg = TYPES[entry.type];
  const specs = cfg.pills(entry.data || {}, entry, run, cfg.goal?.perNutrient ? nutrientGoals : goal);
  const shown = cfg.stacked ? specs.slice(0, CAP) : specs;
  const rest = specs.length - shown.length;

  const pills = (
    <>
      {shown.map((s, i) => (
        <Pill key={i} spec={s} color={cfg.color} darkText={cfg.darkText} />
      ))}
      {rest > 0 && (
        <span className="inline-block border-2 rounded-full px-2 py-0.5 font-heading text-[10px] whitespace-nowrap bg-muted text-muted-foreground">
          +{rest} more
        </span>
      )}
    </>
  );

  return (
    <button
      onClick={onEdit}
      className={`relative w-full text-left flex gap-2 border-2 rounded-xl bg-card px-2 py-1.5 transition-transform active:translate-x-[2px] ${
        cfg.stacked ? "items-start" : "items-center"
      }`}
    >
      <span
        className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 border-2 rounded-full"
        style={{ backgroundColor: cfg.color }}
      />
      <span className={`w-10 shrink-0 font-heading text-[11px] tabular-nums text-muted-foreground ${cfg.stacked ? "pt-1" : ""}`}>
        {entry.entry_time}
      </span>
      {cfg.stacked ? (
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="font-heading text-xs uppercase tracking-wide">{cfg.label}</span>
          <span className="flex flex-wrap gap-1 mt-1">{pills}</span>
        </span>
      ) : (
        <>
          <span className="flex-1 min-w-0 truncate font-heading text-xs uppercase tracking-wide">{cfg.label}</span>
          <span className="shrink-0 flex gap-1">{pills}</span>
        </>
      )}
    </button>
  );
}
