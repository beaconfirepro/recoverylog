import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";
import { todayStr, addDays, daysBetween } from "@/lib/dates";

// Sits on the Today page so anything due within three days is the first thing
// she sees. Tapping a reminder opens the Care page where tasks are managed.
export default function TaskReminders() {
  const { patientId } = usePatient();
  const navigate = useNavigate();
  const [due, setDue] = useState([]);

  useEffect(() => {
    if (!patientId) return;
    let live = true;
    (async () => {
      try {
        const r = asRows(await base44.entities.Task.filter({ patient_id: patientId, status: "open" }, "due_date", 100));
        if (!live) return;
        const today = todayStr();
        const cutoff = addDays(today, 3);
        setDue(
          r.filter((t) => (t.due_date || "") <= cutoff).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
        );
      } catch { /* best effort */ }
    })();
    return () => { live = false; };
  }, [patientId]);

  if (due.length === 0) return null;

  return (
    <div className="nb-card overflow-hidden" style={{ borderColor: "hsl(var(--destructive))" }}>
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Tasks due soon</div>
          <div className="text-sm font-semibold break-words">
            {due.length} {due.length === 1 ? "task" : "tasks"} due within 3 days.
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {due.map((t) => {
          const days = daysBetween(todayStr(), t.due_date);
          const overdue = days < 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate("/care")}
              className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{t.title}</div>
                <div className="text-xs font-semibold break-words">
                  <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                    {overdue ? `${-days}d overdue` : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days}d`}
                  </span>
                  {t.assigned_to && <span className="text-muted-foreground"> · {t.assigned_to}</span>}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}