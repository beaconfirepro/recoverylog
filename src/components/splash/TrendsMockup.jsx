import React from "react";

// A simple line chart of pain over the first week.
export default function TrendsMockup() {
  const pts = [7, 5, 5, 3, 3, 2, 2];
  const w = 200, h = 90, pad = 10, max = 10;
  const step = (w - pad * 2) / (pts.length - 1);
  const points = pts.map((v, i) => `${pad + i * step},${h - pad - (v / max) * (h - pad * 2)}`).join(" ");
  return (
    <div className="space-y-2">
      <div className="bg-foreground text-background px-2 py-1.5 rounded-lg">
        <span className="font-display text-[10px] uppercase tracking-widest">Trends</span>
      </div>
      <div className="border-2 rounded-xl bg-card p-2 space-y-1 shadow-[3px_3px_0_hsl(var(--foreground))]">
        <div className="font-heading text-[9px] uppercase">Pain · 7 days</div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
          <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((v, i) => (
            <circle key={i} cx={pad + i * step} cy={h - pad - (v / max) * (h - pad * 2)} r="3" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="flex justify-between text-[7px] font-semibold text-muted-foreground">
          <span>Day 0</span>
          <span>Day 6</span>
        </div>
      </div>
    </div>
  );
}