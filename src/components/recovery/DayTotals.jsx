import React from "react";
import { RED_FLAG_ITEMS, goalFor, nutrientGoals } from "@/lib/recovery";

// Raised by the day's own entries, or raised by her. Drawn rather than set as
// an emoji because there is no deep-orange flag in the emoji set, and the
// colour is the whole point: it says who noticed.
const AUTO = "#E8590C";
const MINE = "#E01E37";

function Flag({ color, title }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" role="img" aria-label={title}>
      <title>{title}</title>
      <path d="M5 3v18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M6.5 4h11l-2.5 4 2.5 4h-11z" fill={color} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
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
              color={sources[f.key] === "auto" ? AUTO : MINE}
              title={`${f.label} — ${sources[f.key] === "auto" ? "raised by your entries" : "raised by you"}`}
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
              <p className="text-[11px] font-semibold text-muted-foreground">Set a goal in Profile to see this out of a target.</p>
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
    </div>
  );
}