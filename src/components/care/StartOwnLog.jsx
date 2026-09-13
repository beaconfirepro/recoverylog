import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient } from "@/lib/PatientContext";
import Field from "@/components/Field";

// A care team member signed in to help with someone else's log. This lets them
// start their own recovery log on the same account, so they can track their own
// surgery or recovery without a second sign-in. It creates a patient row under
// their own email the way the first-run claim screen does, then switches the
// account to it with write access.
export default function StartOwnLog() {
  const navigate = useNavigate();
  const { user, checkUserAuth } = useAuth();
  const { me } = usePatient();
  const [started, setStarted] = useState(false);
  const [form, setForm] = useState({
    first_name: me?.first_name || "",
    last_name: me?.last_name || "",
    dob: user?.dob || ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = form.first_name.trim() && form.last_name.trim() && form.dob;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError("");
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const created = await base44.entities.AppUser.create({
        email: String(user.email).trim().toLowerCase(),
        kind: "patient",
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        dob: form.dob
      });
      // Link the account to the new row with write access — it is the account's
      // own log — then re-read the account so PatientContext picks the new group
      // up. The row's own patient_id field is not needed: PatientContext uses the
      // row's id as the group id, and writing it back in a second call raced the
      // create and failed with "not found".
      await base44.auth.updateMe({ patient_id: created.id, write_patient_id: created.id });
      await checkUserAuth();
      navigate("/");
    } catch {
      setError("Could not start your log. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <UserPlus className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Your own log</div>
          <div className="text-sm font-semibold break-words">
            You help with someone else's. You can also keep your own recovery log on this account.
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {!started ? (
          <button
            type="button"
            className="nb-btn w-full h-12 bg-primary text-primary-foreground"
            onClick={() => setStarted(true)}
          >
            Start my own log
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 min-w-0">
              <Field label="Your first name">
                <input type="text" value={form.first_name} onChange={set("first_name")} className="nb-input" />
              </Field>
              <Field label="Your last name">
                <input type="text" value={form.last_name} onChange={set("last_name")} className="nb-input" />
              </Field>
              <Field label="Your date of birth" span>
                <input type="date" value={form.dob} onChange={set("dob")} className="nb-input" />
              </Field>
            </div>
            <p className="text-xs font-semibold text-muted-foreground break-words">
              Your date of birth is the second thing your own care team confirms to get in, alongside a code you read out.
            </p>
            {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}
            <div className="flex gap-2 min-w-0">
              <button
                type="button"
                className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground disabled:opacity-40"
                onClick={submit}
                disabled={busy || !ready}
              >
                {busy ? "Starting…" : "Start my log"}
              </button>
              <button
                type="button"
                className="nb-btn h-12 px-4 shrink-0 bg-card"
                onClick={() => setStarted(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}