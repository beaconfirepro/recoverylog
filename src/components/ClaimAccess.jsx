import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient } from "@/lib/PatientContext";
import Field from "@/components/Field";
import { codeMatches } from "@/lib/joinCode";

// Shown to a signed-in account not yet linked to a patient, in one of three
// states: someone the patient has already invited, someone starting their own
// log, or someone who has to be invited before there is anything to open.
export default function ClaimAccess() {
  const { user, logout, checkUserAuth } = useAuth();
  const { me, refreshPatient } = usePatient();
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", dob: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = me && me.kind === "team_member" && me.patient_id ? me : null;
  const ready = form.first_name.trim() && form.last_name.trim() && form.dob;

  const claim = async () => {
    setBusy(true);
    setError("");
    if (!codeMatches(invite, code)) {
      setError("That code doesn't match your invitation. Ask the patient to read it out again.");
      setBusy(false);
      return;
    }
    // Read only: a care team member never carries a write claim.
    await base44.auth.updateMe({ patient_id: invite.patient_id, write_patient_id: null });
    // The link lives on the account, not on the row, so re-read the account.
    // Without this the write lands but the screen keeps its old copy of the
    // user, reads patient_id as unset, and sits here as if nothing happened.
    await checkUserAuth();
    setBusy(false);
  };

  // The patient writes her own row, so she owns it. Row security lets an
  // account create exactly one thing for itself: a patient row under its own
  // email. Everything else in her group is hers to write from here on.
  const startLog = async () => {
    setBusy(true);
    setError("");
    const created = await base44.entities.AppUser.create({
      // Stored the way an invite is stored, so the two are always comparable.
      email: String(user.email).trim().toLowerCase(),
      kind: "patient",
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      dob: form.dob
    });
    // A patient row points at itself, and the id does not exist until the row
    // does. PatientContext links the account on the reload.
    await base44.entities.AppUser.update(created.id, { patient_id: created.id });
    await refreshPatient();
    setBusy(false);
  };

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError("");
  };

  const joinCode = (
    <div className="space-y-3 min-w-0">
      <Field label="Join code">
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder="7K2-QM4"
          className="nb-input tracking-[0.3em] text-center uppercase"
        />
      </Field>

      {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}

      <button
        className="nb-btn w-full h-14 bg-primary text-primary-foreground disabled:opacity-40"
        onClick={claim}
        disabled={busy || !code.trim()}
      >
        {busy ? "Checking…" : "Open the log"}
      </button>
    </div>
  );

  const details = (labelPrefix, onSubmit, cta) => (
    <div className="grid grid-cols-2 gap-3 min-w-0">
      <Field label={`${labelPrefix} first name`}>
        <input type="text" value={form.first_name} onChange={set("first_name")} className="nb-input" />
      </Field>
      <Field label={`${labelPrefix} last name`}>
        <input type="text" value={form.last_name} onChange={set("last_name")} className="nb-input" />
      </Field>
      <Field label={`${labelPrefix} date of birth`} span>
        <input type="date" value={form.dob} onChange={set("dob")} className="nb-input" />
      </Field>

      {error && <p className="col-span-2 text-sm font-bold text-destructive break-words">{error}</p>}

      <button
        className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground"
        onClick={onSubmit}
        disabled={busy || !ready}
      >
        {busy ? "Checking…" : cta}
      </button>
    </div>
  );

  let heading = "Find the log";
  let blurb = `Signed in as ${user?.email}. Enter the join code the patient gave you.`;
  if (!me && !role) {
    heading = "Whose log is this";
    blurb = `Signed in as ${user?.email}. This account is not on a recovery log yet.`;
  } else if (!me && role === "patient") {
    heading = "Start your log";
    blurb = "Your name and date of birth are what your care team will use to find you.";
  } else if (!me && role === "team_member") {
    heading = "Ask to be added";
    blurb = `Signed in as ${user?.email}.`;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">{heading}</div>
          <div className="text-sm font-semibold break-words">{blurb}</div>
        </div>

        <div className="p-4 space-y-3">
          {invite && joinCode}

          {!invite && me && (
            <p className="text-sm font-semibold break-words">
              This account has not been added to a recovery log. Ask the patient to add {user?.email} to their care
              team, then sign in again.
            </p>
          )}

          {!me && !role && (
            <div className="space-y-2">
              <button
                type="button"
                className="nb-btn w-full h-14 bg-primary text-primary-foreground"
                onClick={() => setRole("patient")}
              >
                I am the patient
              </button>
              <button type="button" className="nb-btn w-full h-14 bg-card" onClick={() => setRole("team_member")}>
                I am on someone's care team
              </button>
            </div>
          )}

          {!me && role === "patient" && details("Your", startLog, "Start my log")}

          {!me && role === "team_member" && (
            <p className="text-sm font-semibold break-words">
              Only the patient can add you. Ask them to add {user?.email} to their care team, then sign in again.
            </p>
          )}

          {!me && role && (
            <button className="nb-btn w-full h-12 bg-card" onClick={() => setRole(null)}>
              Back
            </button>
          )}

          <button className="nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
