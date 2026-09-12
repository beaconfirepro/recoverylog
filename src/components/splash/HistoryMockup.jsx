import React from "react";

const days = [
  { d: "Day 3", pills: ["Water 64oz", "Pain 3", "Sleep 7h"], flag: false },
  { d: "Day 2", pills: ["Water 48oz", "Pain 5", "Walk 10m"], flag: true },
  { d: "Day 1", pills: ["Water 32oz", "Pain 7"], flag: false }
];

// The history view: a stack of day cards with summary pills and red flags.
export default function HistoryMockup() {
  return (
    <div className="space-y-2">
      <div className="bg-foreground text-background px-2 py-1.5 rounded-lg">
        <span className="font-display text-[10px] uppercase tracking-widest">History</span>
      </div>
      {days.map((day) => (
        <div key={day.d} className="border-2 rounded-xl bg-card p-2 space-y-1 shadow-[3px_3px_0_hsl(var(--foreground))]">
          <div className="flex items-center justify-between">
            <span className="font-display text-[10px] uppercase">{day.d}</span>
            {day.flag && <span className="text-[8px] font-bold text-destructive">⚠ flag</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {day.pills.map((p) => (
              <span key={p} className="text-[8px] font-bold border-2 rounded-full px-1.5 py-0.5 bg-muted">{p}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}