import React from "react";
import { choosableRecords, isAll, isMaintenance } from "@/lib/scope";

// The segmented chip row that lives on the day header (and atop History and
// Trends): "All" plus one chip per record. Tapping a record narrows the view to
// that record; tapping "All" unions every record on the same calendar date.
// Maintenance gets the lime accent so it never reads as a surgery missing its
// date.
export default function ScopeSwitch({ surgeries, scope, onScope, className = "" }) {
  const records = choosableRecords(surgeries);
  if (records.length <= 1) return null;

  const all = isAll(scope);
  const activeId = !all && scope?.ids?.length === 1 ? scope.ids[0] : null;

  const chip = (active, onClick, label, style) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="nb-chip px-3 py-1.5 text-xs whitespace-nowrap"
      style={active ? style || { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" } : {}}
    >
      {label}
    </button>
  );

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 ${className}`}>
      {chip(all, () => onScope({ all: true, ids: [] }), "All", { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" })}
      {records.map((r) =>
        chip(
          activeId === r.id,
          () => onScope({ all: false, ids: [r.id] }),
          isMaintenance(r) ? "Maintenance" : r.label || "Surgery",
          isMaintenance(r)
            ? { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }
            : { backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }
        )
      )}
    </div>
  );
}