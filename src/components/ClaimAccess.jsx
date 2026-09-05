import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, maskName } from "@/lib/PatientContext";
import Field from "@/components/Field";

// Shown to a signed-in account that is not yet linked to a patient. The sign-in
// already happened; this only settles which invited person is holding the phone.
export default function ClaimAccess() {
  const { user, logout } = useAuth();
  const { invites, refreshPatient } = usePatient();
  const [picked, setPicked] = useState(null);
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = invites.filter((i) => i.patient_id);

  const claim = async () => {
    setBusy(true);
    setError("");
    if (dob !== picked.dob) {
      setError("That date of birth does not match this invite.");
      setBusy(false);
      return;
    }
    await base44.auth.updateMe({ patient_id: picked.patient_id });
    await base44.entities.PatientGroup.update(picked.id, { claimed_at: new Date().toISOString() });
    await refreshPatient();
    setBusy(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Confirm who you are</div>
          <div className="text-sm font-semibold break-words">
            Signed in as {user?.email}. Pick your name, then confirm your date of birth.
          </div>
        </div>

        <div className="p-4 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm font-semibold break-words">
              This account has no invitation to a recovery log. Ask the patient to add {user?.email} to their care
              team, then sign in again.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                {pending.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      setPicked(i);
                      setDob("");
                      setError("");
                    }}
                    className="nb-btn w-full h-12 justify-start px-3 font-heading tracking-widest"
                    style={
                      picked?.id === i.id
                        ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" }
                        : {}
                    }
                  >
                    {maskName(i.full_name)}
                  </button>
                ))}
              </div>

              {picked && (
                <>
                  <Field label="Your date of birth" span>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => {
                        setDob(e.target.value);
                        setError("");
                      }}
                      className="nb-input"
                    />
                  </Field>
                  {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}
                  <button
                    className="nb-btn w-full h-14 bg-primary text-primary-foreground"
                    onClick={claim}
                    disabled={busy || !dob}
                  >
                    {busy ? "Checking…" : "Open the log"}
                  </button>
                </>
              )}
            </>
          )}

          <button className="nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
