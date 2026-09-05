import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { parseDate, postOpLabel } from "@/lib/dates";

const Stat = ({ label, value }) => (
  <div className="border-2 rounded-xl px-2.5 py-1.5 bg-muted min-w-0">
    <div className="text-[9px] font-heading uppercase tracking-wider text-muted-foreground truncate">{label}</div>
    <div className="text-sm font-bold truncate">{value}</div>
  </div>
);

// Read-only. Everything here is derived from the day's entries — nothing is
// typed in twice.
export default function DayHeader({ day, surgeryDate, totals, lastBm }) {
  const [statsOpen, setStatsOpen] = useState(true);

  const dayLabel = postOpLabel(surgeryDate, day.date);

  const measEntries = totals.measurements
    ? Object.entries(totals.measurements).filter(([k, v]) => v !== null && v !== "" && k !== "photo_url")
    : [];

  return (
    <div className="nb-card p-4 space-y-3">
      <div className="min-w-0">
        {dayLabel ? (
          <h1 className="font-display text-3xl leading-none uppercase break-words">{dayLabel}</h1>
        ) : (
          <h1 className="font-display text-xl leading-tight uppercase text-destructive">Surgery date not set</h1>
        )}
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          {parseDate(day.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
        <CollapsibleTrigger className="w-full flex items-center justify-between font-heading text-[11px] uppercase tracking-wider">
          From your entries
          <ChevronDown className={`w-4 h-4 transition-transform ${statsOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Stat label="Last BM" value={lastBm} />
            <Stat label="Next med" value={totals.nextMed ? `${totals.nextMed.time}` : "—"} />
            <Stat label="Photos" value={totals.photoTaken ? "Yes" : "No"} />
            <Stat label="Temp AM" value={totals.tempAm ?? "—"} />
            <Stat label="Temp PM" value={totals.tempPm ?? "—"} />
            <Stat label="Weight" value={totals.weight ?? "—"} />
            {measEntries.map(([k, v]) => (
              <Stat key={k} label={k} value={v} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
