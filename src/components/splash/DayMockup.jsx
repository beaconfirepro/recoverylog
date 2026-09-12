import React from "react";
import { Droplets, Pill, Utensils, HeartPulse } from "lucide-react";

const tiles = [
  { icon: Droplets, label: "Water", color: "hsl(190 95% 45%)" },
  { icon: Pill, label: "Meds", color: "hsl(330 100% 55%)" },
  { icon: Utensils, label: "Meals", color: "hsl(30 100% 50%)" },
  { icon: HeartPulse, label: "Pain", color: "hsl(0 85% 52%)" }
];

const feed = [
  { c: "hsl(190 95% 45%)", t: "08:14", l: "Water", p: "8 oz" },
  { c: "hsl(330 100% 55%)", t: "09:00", l: "Meds", p: "Gabapentin" },
  { c: "hsl(0 85% 52%)", t: "09:30", l: "Check-in", p: "Pain 3/10" }
];

// The day view: a day label, the quick-add tiles, and a slice of the timeline.
export default function DayMockup() {
  return (
    <div className="space-y-2">
      <div className="bg-foreground text-background px-2 py-1.5 rounded-lg flex items-center justify-between">
        <span className="font-display text-[10px] uppercase tracking-widest">LipNode</span>
        <span className="w-4 h-4 rounded-full border border-background" />
      </div>
      <div className="border-2 rounded-xl bg-card p-2 shadow-[3px_3px_0_hsl(var(--foreground))]">
        <div className="font-display text-lg uppercase leading-none">Day 3</div>
        <div className="text-[9px] font-semibold text-muted-foreground">Wednesday</div>
        <div className="mt-1 inline-block text-[8px] font-heading uppercase bg-muted rounded px-1.5 py-0.5">Tummy tuck</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {tiles.map((t) => (
          <div key={t.label} className="border-2 rounded-lg p-1.5 flex flex-col items-center gap-0.5" style={{ backgroundColor: t.color, borderColor: "hsl(var(--foreground))" }}>
            <t.icon className="w-3.5 h-3.5 text-white" />
            <span className="text-[7px] font-bold text-white uppercase leading-none">{t.label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {feed.map((e) => (
          <div key={e.t} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ backgroundColor: e.c, borderColor: "hsl(var(--foreground))" }} />
            <div className="flex-1 border-2 rounded-lg px-1.5 py-1 flex items-center justify-between bg-card min-w-0">
              <span className="text-[9px] font-bold truncate">{e.l}</span>
              <span className="text-[8px] font-semibold text-muted-foreground shrink-0">{e.t} · {e.p}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}