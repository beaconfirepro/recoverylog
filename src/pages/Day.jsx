import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { isDayStr, todayStr } from "@/lib/dates";
import DayView from "@/components/recovery/DayView";

export default function Day() {
  const { date } = useParams();

  // The date comes out of the URL, so it is whatever was typed or pasted.
  // parseDate would quietly roll "2026-02-30" into March, and the page creates
  // the day row it is looking at — so an unreachable date would leave a row
  // behind in a medical record. A future date is refused for the same reason
  // the next-day arrow stops at today: there is nothing there to log.
  if (!isDayStr(date) || date > todayStr()) {
    return (
      <div className="nb-card p-4 space-y-3">
        <p className="text-sm font-semibold break-words">
          {isDayStr(date)
            ? "That day has not happened yet. You can only log a day once you have lived it."
            : "That is not a day this log can open."}
        </p>
        <Link to="/history" className="nb-btn h-11 px-3 bg-card text-xs inline-flex">
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Day by Day
        </Link>
      </div>
    );
  }

  // A day reached from History is opened to read, so its add grid starts shut.
  // Today's page is where logging happens and stays open.
  return <DayView date={date} startCollapsed />;
}
