import React from "react";

export default function DayTotals({ totals }) {
  const rows = [
    { label: "Water", value: `${totals.water} / 100 oz`, frac: totals.water / 100, color: "#00B4D8" },
    { label: "Protein", value: `${totals.protein} / 100 g`, frac: totals.protein / 100, color: "#FF9E00" },
    { label: "In garment", value: `${(totals.garmentMin / 60).toFixed(1)} h`, frac: null, color: "#06D6A0" },
    { label: "Movement", value: totals.walks, frac: null, color: "#4361EE" },
    { label: "Sleep + naps", value: `${(totals.sleepH + totals.napH).toFixed(1)} h`, frac: null, color: "#5A189A" },
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
            {r.frac !== null && (
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