import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { usePatient } from "@/lib/PatientContext";
import Field from "@/components/Field";

const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

// Shown to a signed-in account not yet linked to a patient, in one of three
// states: someone the patient has already invited, someone starting their own
// log, or someone who has to be invited before there is anything to open.
export default function ClaimAccess() {
  const { user, logout } = useAuth();
  const { me, refreshPatient } = usePatient();
  const [role, setRole] = useState(null);
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

  // The patient writes her own row, so she owns it. Row security lets an
  // account create exactly one thing for itself: a patient row under its own
  // email. Everything else in her group is hers to write from here on.
  const startLog = async () => {
    setBusy(true);
    setError("");
    const created = await base44.entities.AppUser.create({
      email: user.email,
      kind: "patient",
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      dob: form.dob,
      can_write: true
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
  let blurb = `Signed in as ${user?.email}. Enter the patient's details to open their log.`;
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
          {invite && details("Patient", claim, "Open the log")}

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
