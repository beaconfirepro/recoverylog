import React from "react";
import { RED_FLAG_ITEMS, flagLabel, goalFor, nutrientGoals } from "@/lib/recovery";

// Raised by the day's own entries, or raised by her.
//
// This used to be two colours and nothing else, which is a distinction a good
// number of people cannot make at 20px — and the fallback was a <title>, which
// is a hover tooltip, and there is no hover on a phone. So the two also differ
// in shape: the swallowtail is the app reading her entries, the straight
// pennant is her own answer. Both survive greyscale, and the key underneath
// makes them learnable rather than guessable.
const AUTO = "#E8590C";
const MINE = "#E01E37";

function Flag({ mine, title, className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <path d="M5 3v18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      {mine ? (
        <path d="M6.5 4h11v8h-11z" fill={MINE} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      ) : (
        <path d="M6.5 4h11l-2.5 4 2.5 4h-11z" fill={AUTO} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function DayTotals({ totals, day, surgery }) {
  // A bar only where there is a goal to measure against. Without one the number
  // is the whole answer and a half-full bar would be inventing a target.
  const water = goalFor(surgery, "water");
  const bodywork = goalFor(surgery, "bodywork");
  const protein = nutrientGoals(surgery).Protein;

  // A goal makes the number a fraction: 46 of 64 says where the day stands in
  // a way that 46 on its own cannot. Without one there is nothing to be out of.
  const of = (n, goal, unit) => (goal ? `${n} of ${goal} ${unit}` : `${n} ${unit}`);

  const answers = day?.red_flag_answers || {};
  const sources = day?.red_flag_sources || {};
  const raised = RED_FLAG_ITEMS.filter((f) => answers[f.key] === "yes");

  const rows = [
    { label: "Water", value: of(totals.water, water, "oz"), frac: water && totals.water / water, color: "#00B4D8", needsGoal: !water },
    { label: "Protein", value: of(totals.protein, protein, "g"), frac: protein && totals.protein / protein, color: "#E85D04", needsGoal: !protein },
    { label: "Body work", value: of(totals.bodyworkMin, bodywork, "min"), frac: bodywork && totals.bodyworkMin / bodywork, color: "#B5179E", needsGoal: !bodywork },
    { label: "In compression", value: `${(totals.garmentMin / 60).toFixed(1)} h`, frac: null, color: "#06D6A0" },
    { label: "Movement", value: totals.walks, frac: null, color: "#4361EE" },
    { label: "Rest", value: `${(totals.sleepH + totals.napH).toFixed(1)} h`, frac: null, color: "#5A189A" },
    { label: "Temp PM", value: totals.tempPm ?? "—", frac: null, color: "#FF006E" },
    { label: "Best check-in", value: totals.best ? `${totals.best.slot} · ${totals.best.time}` : "—", frac: null, color: "#06D6A0" },
    { label: "Worst check-in", value: totals.worst ? `${totals.worst.slot} · ${totals.worst.time}` : "—", frac: null, color: "#FF2E88" },
    {
      label: "Red flags",
      frac: null,
      value: raised.length ? (
        <span className="inline-flex flex-wrap justify-end gap-1">
          {raised.map((f) => (
            <Flag
              key={f.key}
              mine={sources[f.key] !== "auto"}
              title={`${flagLabel(f, surgery)} — ${sources[f.key] === "auto" ? "raised by your entries" : "raised by you"}`}
            />
          ))}
        </span>
      ) : (
        "none"
      )
    }
  ];
  return (
    <div className="nb-card p-4">
      <h2 className="font-heading text-sm uppercase tracking-wider mb-3">Day totals</h2>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="font-heading text-sm">{r.value}</span>
            </div>
            {r.needsGoal && (
              <p className="text-2xs font-semibold text-muted-foreground">Set a goal in Setup.</p>
            )}
            {!!r.frac && (
              <div className="h-3 border-2 rounded-full mt-1 overflow-hidden bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (r.frac || 0) * 100)}%`, backgroundColor: r.color }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Two shapes need naming once, or they are two shapes. */}
      {raised.length > 0 && (
        <div className="mt-3 pt-2 border-t-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
            <Flag mine={false} className="w-4 h-4" title="" /> raised by your entries
          </span>
          <span className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground">
            <Flag mine className="w-4 h-4" title="" /> raised by you
          </span>
        </div>
      )}
    </div>
  );
}