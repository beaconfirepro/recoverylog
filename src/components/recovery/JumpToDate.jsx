import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, X } from "lucide-react";
import { isDayStr, todayStr } from "@/lib/dates";

// "Take me to a day." One control, on the day header and atop Day by Day,
// because it answers two questions with the same tap: the day you missed while
// you were too unwell to log it, and the day before an appointment three months
// back. Day by Day is built from the days that have entries, so without this a
// missed day is not reachable at all.
export default function JumpToDate({ value, className = "" }) {
  const navigate = useNavigate();
  const today = todayStr();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(isDayStr(value) ? value : today);

  // There is nothing to log in the future, and "Pre-op · 40 days to go" on a
  // day that has not happened reads as a prediction rather than a record.
  const ok = isDayStr(draft) && draft <= today;

  const go = () => {
    if (!ok) return;
    setOpen(false);
    // Today has a page of its own, with the add grid already open. Sending her
    // to /day/<today> would be the same day with the logging folded away.
    navigate(draft === today ? "/" : `/day/${draft}`);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`nb-chip px-3 py-1.5 text-xs gap-1.5 bg-card ${className}`}
      >
        <CalendarDays className="w-4 h-4 shrink-0" />
        Jump to a day
      </button>
    );
  }

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {/* A draft and a Go button rather than opening the day as the value
            changes: iOS fires a change on every turn of the date wheel, so
            navigating on change would walk her through half a month on the way
            to the day she was aiming at. */}
        <input
          type="date"
          value={draft}
          max={today}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Day to open"
          className="nb-input flex-1"
        />
        <button
          type="button"
          onClick={go}
          disabled={!ok}
          className="nb-btn h-12 px-4 shrink-0 bg-primary text-primary-foreground disabled:opacity-40"
        >
          Go
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the day picker"
          className="nb-btn h-12 w-12 shrink-0 bg-card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {!ok && (
        // The input carries a max, but a typed date gets past it on a desktop
        // keyboard, so the reason is said out loud rather than the button just
        // sitting there dead.
        <p className="text-xs font-semibold text-muted-foreground break-words">
          Pick a day up to today.
        </p>
      )}
    </div>
  );
}
