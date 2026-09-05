import React from "react";
import { parseDate, postOpLabel } from "@/lib/dates";
import { usePatient } from "@/lib/PatientContext";

// Read-only. The day label counts from whichever surgery is selected, so the
// picker sits with the label rather than buried on another page.
export default function DayHeader({ day }) {
  const { surgeries, activeSurgery, activeSurgeryId, selectSurgery } = usePatient();

  const dayLabel = postOpLabel(activeSurgery?.surgery_date, day.date);
  const choosable = surgeries.filter((s) => !s.archived || s.id === activeSurgeryId);

  return (
    <div className="nb-card p-4 space-y-3">
      <div className="min-w-0">
        {dayLabel ? (
          <h1 className="font-display text-3xl leading-none uppercase break-words">{dayLabel}</h1>
        ) : (
          <h1 className="font-display text-xl leading-tight uppercase text-destructive">
            {activeSurgery ? "Surgery date not set" : "No surgery yet"}
          </h1>
        )}
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          {parseDate(day.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-1.5 min-w-0">
        <label htmlFor="surgery-picker" className="nb-label">
          Tracking
        </label>
        {choosable.length === 0 ? (
          <p className="text-sm font-semibold break-words">
            Add a surgery on the Surgery page and days will count from its date.
          </p>
        ) : (
          <select
            id="surgery-picker"
            className="nb-input"
            value={activeSurgeryId || ""}
            onChange={(e) => selectSurgery(e.target.value)}
          >
            {choosable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.surgery_date ? ` · ${s.surgery_date}` : ""}
                {s.archived ? " (archived)" : ""}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
