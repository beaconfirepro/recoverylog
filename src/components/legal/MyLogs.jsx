import React, { useState } from "react";
import { Check, LogOut } from "lucide-react";
import { usePatient } from "@/lib/PatientContext";

const labelFor = (g) =>
  g.own
    ? "Your own log"
    : [g.row.match_first_name, g.row.match_last_name].filter(Boolean).join(" ").trim() || "This patient";

// Someone can be a patient and on another person's care team at the same time.
// Opening one switches the whole app over to that log, so it says which is
// open and asks before stepping off a team.
export default function MyLogs() {
  const { groups, patientId, switchPatient, leaveTeam } = usePatient();
  const [leaving, setLeaving] = useState(null);
  const [busy, setBusy] = useState(false);

  // Shown whenever this account is on someone's care team, not only when there
  // are two logs to choose between. The leave control lives in here, and access
  // someone gave you has to be yours to hand back from the first log onwards.
  const onATeam = groups.some((g) => !g.own);
  if (!onATeam) return null;

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">Logs you help with</div>
        <div className="text-sm font-semibold break-words">
          {groups.length === 1 ? "One log." : `${groups.length} logs. One is open at a time.`}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {groups.map((g) => {
          const open = g.id === patientId;
          return (
            <div key={g.row.id} className="border-2 rounded-xl bg-background p-3 space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-1 min-w-0">
                  <span className="block nb-label truncate">{labelFor(g)}</span>
                  <span className="block text-xs font-semibold text-muted-foreground truncate">
                    {g.own ? "Patient" : g.row.can_write === false ? "Read only" : "Can edit"}
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
                      await switchPatient(g.id);
                    }}
                  >
                    Open
                  </button>
                )}
              </div>

              {/* Your own log is not a care team you can step off. Getting rid
                  of that is Delete my account, further down. */}
              {!g.own &&
                (leaving === g.row.id ? (
                  <div className="flex gap-2 min-w-0">
                    <button
                      type="button"
                      className="nb-btn flex-1 min-w-0 h-11 bg-destructive text-destructive-foreground"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        await leaveTeam(g.row.id);
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
                  <button type="button" className="nb-chip gap-1.5 bg-muted" onClick={() => setLeaving(g.row.id)}>
                    <LogOut className="w-3.5 h-3.5" /> Leave this care team
                  </button>
                ))}
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
