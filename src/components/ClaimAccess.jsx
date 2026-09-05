import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient } from "@/lib/PatientContext";
import Field from "@/components/Field";

// Shown to a signed-in account not yet linked to a patient. Sign-in already
// happened; this asks who the patient is. The check runs in the claimAccess
// backend function — the browser cannot see the patient's row to compare.
export default function ClaimAccess() {
  const { user, logout } = useAuth();
  const { refreshPatient } = usePatient();
  const [form, setForm] = useState({ first_name: "", last_name: "", dob: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = form.first_name.trim() && form.last_name.trim() && form.dob;

  const claim = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("claimAccess", form);
      if (res?.data?.ok || res?.ok) {
        await refreshPatient();
        return;
      }
      setError(res?.data?.error || res?.error || "Those patient details do not match.");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not check those details.");
    } finally {
      setBusy(false);
    }
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

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
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

          <p className="col-span-2 text-[11px] font-semibold text-muted-foreground break-words">
            This only works if the patient has already added {user?.email} to their care team.
          </p>

          <button className="col-span-2 nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
