import React from "react";

// The check-in asks one measure at a time. Shown as pain on a 0-10 scale.
export default function CheckinMockup() {
  return (
    <div className="space-y-2">
      <div className="bg-foreground text-background px-2 py-1.5 rounded-lg">
        <span className="font-display text-[10px] uppercase tracking-widest">LipNode</span>
      </div>
      <div className="border-2 rounded-xl bg-card p-2 space-y-2 shadow-[3px_3px_0_hsl(var(--foreground))]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--primary))", borderColor: "hsl(var(--foreground))" }}>
            <span className="text-[8px] font-bold text-white">✓</span>
          </div>
          <span className="font-heading text-[9px] uppercase">Check-in · Waking</span>
        </div>
        <div className="font-display text-sm uppercase leading-tight">How's your pain?</div>
        <div className="flex justify-between gap-0.5">
          {[0, 2, 4, 6, 8, 10].map((n, i) => (
            <span key={n} className="flex-1 text-center text-[8px] font-bold border-2 rounded py-1 bg-card" style={i === 1 ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}>
              {n}
            </span>
          ))}
        </div>
        <div className="flex justify-center gap-1">
          {[0, 1, 2, 3].map((d) => (
            <span key={d} className="w-1.5 h-1.5 rounded-full border" style={{ backgroundColor: d < 1 ? "hsl(var(--primary))" : "transparent", borderColor: "hsl(var(--foreground))" }} />
          ))}
        </div>
        <div className="nb-btn h-7 bg-primary text-primary-foreground text-[9px]">Next</div>
      </div>
    </div>
  );
}