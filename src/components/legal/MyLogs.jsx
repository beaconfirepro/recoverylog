import React, { useState } from "react";
import { Check, LogOut } from "lucide-react";
import { usePatient } from "@/lib/PatientContext";

const nameOf = (m) =>
  [m.match_first_name, m.match_last_name].filter(Boolean).join(" ").trim() || "This patient";

// A care team member can be on more than one person's team. Opening one is
// switching the whole app over to that log, so it says which is open and asks
// before stepping off a team.
export default function MyLogs() {
  const { memberships, patientId, switchPatient, leaveTeam } = usePatient();
  const [leaving, setLeaving] = useState(null);
  const [busy, setBusy] = useState(false);

  if (memberships.length === 0) return null;

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">Logs you can open</div>
        <div className="text-sm font-semibold break-words">
          {memberships.length === 1 ? "One care team." : `${memberships.length} care teams.`}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {memberships.map((m) => {
          const open = m.patient_id === patientId;
          return (
            <div key={m.id} className="border-2 rounded-xl bg-background p-3 space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-1 min-w-0">
                  <span className="block nb-label truncate">{nameOf(m)}</span>
                  <span className="block text-xs font-semibold text-muted-foreground truncate">
                    {m.can_write === false ? "Read only" : "Can edit"}
                  </span>
                </span>
                {open ? (
                  <span className="nb-chip shrink-0 bg-muted flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Open
                  </span>
                ) : (
                  <button
                    type="button"
                    className="nb-chip shrink-0 bg-accent text-accent-foreground"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await switchPatient(m.patient_id);
                    }}
                  >
                    Open
                  </button>
                )}
              </div>

              {leaving === m.id ? (
                <div className="flex gap-2 min-w-0">
                  <button
                    type="button"
                    className="nb-btn flex-1 min-w-0 h-11 bg-destructive text-destructive-foreground"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await leaveTeam(m.id);
                      setLeaving(null);
                      setBusy(false);
                    }}
                  >
                    Leave for good
                  </button>
                  <button
                    type="button"
                    className="nb-btn h-11 px-4 shrink-0 bg-card"
                    onClick={() => setLeaving(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="nb-chip gap-1.5 bg-muted"
                  onClick={() => setLeaving(m.id)}
                >
                  <LogOut className="w-3.5 h-3.5" /> Leave this care team
                </button>
              )}
            </div>
          );
        })}

        <p className="text-xs font-semibold text-muted-foreground break-words">
          Leaving ends your access to that log. The patient can add you again.
        </p>
      </div>
    </div>
  );
}
