import React from "react";
import { goalFor, nutrientGoals } from "@/lib/recovery";

export default function DayTotals({ totals, surgery }) {
  // A bar only where there is a goal to measure against. Without one the number
  // is the whole answer and a half-full bar would be inventing a target.
  const water = goalFor(surgery, "water");
  const bodywork = goalFor(surgery, "bodywork");
  const protein = nutrientGoals(surgery).Protein;

  const rows = [
    { label: "Water", value: water ? `${totals.water} / ${water} oz` : `${totals.water} oz`, frac: water && totals.water / water, color: "#00B4D8" },
    { label: "Protein", value: protein ? `${totals.protein} / ${protein} g` : `${totals.protein} g`, frac: protein && totals.protein / protein, color: "#E85D04" },
    { label: "Body work", value: bodywork ? `${totals.bodyworkMin} / ${bodywork} min` : `${totals.bodyworkMin} min`, frac: bodywork && totals.bodyworkMin / bodywork, color: "#B5179E" },
    { label: "In compression", value: `${(totals.garmentMin / 60).toFixed(1)} h`, frac: null, color: "#06D6A0" },
    { label: "Movement", value: totals.walks, frac: null, color: "#4361EE" },
    { label: "Rest", value: `${(totals.sleepH + totals.napH).toFixed(1)} h`, frac: null, color: "#5A189A" },
    { label: "Temp PM", value: totals.tempPm ?? "—", frac: null, color: "#FF006E" },
    { label: "Best check-in", value: totals.best ? `${totals.best.slot} · ${totals.best.time}` : "—", frac: null, color: "#06D6A0" },
    { label: "Worst check-in", value: totals.worst ? `${totals.worst.slot} · ${totals.worst.time}` : "—", frac: null, color: "#FF2E88" }
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