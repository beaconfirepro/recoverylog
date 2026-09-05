import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient } from "@/lib/PatientContext";
import Field from "@/components/Field";

const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// Shown to a signed-in account not yet linked to a patient. The invitation is
// the gate: without a row written by the patient there is nothing here to match
// against. The patient's details then say which patient, which is the whole job
// once there is more than one.
export default function ClaimAccess() {
  const { user, logout } = useAuth();
  const { me, refreshPatient } = usePatient();
  const [form, setForm] = useState({ first_name: "", last_name: "", dob: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = me && me.kind === "team_member" && me.patient_id ? me : null;
  const ready = form.first_name.trim() && form.last_name.trim() && form.dob;

  const claim = async () => {
    setBusy(true);
    setError("");
    const matches =
      norm(invite.match_first_name) === norm(form.first_name) &&
      norm(invite.match_last_name) === norm(form.last_name) &&
      String(invite.match_dob ?? "") === String(form.dob);

    if (!matches) {
      setError("Those patient details do not match your invitation.");
      setBusy(false);
      return;
    }
    await base44.auth.updateMe({ patient_id: invite.patient_id });
    await refreshPatient();
    setBusy(false);
  };

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError("");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Find the log</div>
          <div className="text-sm font-semibold break-words">
            Signed in as {user?.email}. Enter the patient's details to open their log.
          </div>
        </div>

        <div className="p-4 space-y-3">
          {!invite ? (
            <p className="text-sm font-semibold break-words">
              This account has not been added to a recovery log. Ask the patient to add {user?.email} to their care
              team, then sign in again.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <Field label="Patient first name">
                <input type="text" value={form.first_name} onChange={set("first_name")} className="nb-input" />
              </Field>
              <Field label="Patient last name">
                <input type="text" value={form.last_name} onChange={set("last_name")} className="nb-input" />
              </Field>
              <Field label="Patient date of birth" span>
                <input type="date" value={form.dob} onChange={set("dob")} className="nb-input" />
              </Field>

              {error && <p className="col-span-2 text-sm font-bold text-destructive break-words">{error}</p>}

              <button
                className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground"
                onClick={claim}
                disabled={busy || !ready}
              >
                {busy ? "Checking…" : "Open the log"}
              </button>
            </div>
          )}

          <button className="nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
