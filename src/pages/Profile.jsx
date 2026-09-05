import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Plus, X } from "lucide-react";
import { todayStr, fullDate, daysBetween, MAX_RANGE_DAYS } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, trackedTypes } from "@/lib/PatientContext";
import { TYPES, QUICK_ORDER } from "@/lib/recovery";
import { buildRecoveryPdf } from "@/lib/recoveryPdf";
import Field from "@/components/Field";

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5 border-b-2 last:border-b-0 min-w-0">
    <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm font-bold text-right break-words min-w-0">{value || "—"}</span>
  </div>
);

export default function Profile() {
  const { user, logout } = useAuth();
  const { patient, patientId, isOwner, canWrite, refreshPatient, surgeries, activeSurgery, activeSurgeryId, refreshSurgeries } = usePatient();
  const [team, setTeam] = useState([]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);
  const [invite, setInvite] = useState({ email: "", first_name: "", last_name: "" });
  const [inviteError, setInviteError] = useState("");
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setFirst(patient?.first_name || "");
    setLast(patient?.last_name || "");
    setDob(patient?.dob || "");
  }, [patient]);

  const loadTeam = useCallback(() => {
    if (!patientId) return;
    base44.entities.AppUser.filter({ patient_id: patientId, kind: "team_member" }, "created_date", 50).then(setTeam);
  }, [patientId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const savePatient = async () => {
    setSavingPatient(true);
    const next = { first_name: first.trim(), last_name: last.trim(), dob: dob || null };
    await base44.entities.AppUser.update(patient.id, next);
    // Every member row carries a copy of these to match against, so they move
    // with it. Otherwise a name change would lock the care team out.
    await Promise.all(
      team.map((m) =>
        base44.entities.AppUser.update(m.id, {
          match_first_name: next.first_name,
          match_last_name: next.last_name,
          match_dob: next.dob
        })
      )
    );
    await refreshPatient();
    loadTeam();
    setSavingPatient(false);
  };

  const addMember = async () => {
    const email = invite.email.trim().toLowerCase();
    if (!email || !invite.first_name.trim() || !invite.last_name.trim()) {
      setInviteError("Email, first name and last name are all needed.");
      return;
    }
    if (team.some((m) => m.email === email)) {
      setInviteError("That email is already on the care team.");
      return;
    }
    setInviteError("");
    await base44.entities.AppUser.create({
      patient_id: patientId,
      kind: "team_member",
      email,
      first_name: invite.first_name.trim(),
      last_name: invite.last_name.trim(),
      can_write: true,
      // Copied onto their row so they can match against it. Row security does
      // not let an unlinked account read the patient's own row.
      match_first_name: patient.first_name || "",
      match_last_name: patient.last_name || "",
      match_dob: patient.dob || null
    });
    setInvite({ email: "", first_name: "", last_name: "" });
    loadTeam();
  };

  const removeMember = async (id) => {
    await base44.entities.AppUser.delete(id);
    loadTeam();
  };

  // Tracking settings belong to a surgery, not the person: a knee and a tummy
  // tuck do not want the same buttons.
  const [savingTracking, setSavingTracking] = useState(false);
  const selected = trackedTypes(activeSurgery);

  const patchSurgery = async (fields) => {
    if (!activeSurgery) return;
    setSavingTracking(true);
    await base44.entities.Surgery.update(activeSurgery.id, fields);
    await refreshSurgeries();
    setSavingTracking(false);
  };

  const toggleType = (t) => {
    const next = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
    // Stored in the app's own order so the buttons never shuffle.
    patchSurgery({ tracked_types: QUICK_ORDER.filter((x) => next.includes(x)) });
  };

  // dateRange() stops at MAX_RANGE_DAYS. Silently dropping days out of a record
  // meant for a surgeon is worse than refusing, so block the export instead.
  const spanDays = daysBetween(from, to) + 1;
  const tooWide = spanDays > MAX_RANGE_DAYS;

  const generate = async () => {
    setBusy(true);
    setDone(false);
    const [days, entries] = await Promise.all([
      base44.entities.RecoveryDay.filter({ surgery_id: activeSurgeryId }, "date", 500),
      base44.entities.RecoveryEntry.filter({ surgery_id: activeSurgeryId }, "created_date", 3000)
    ]);
    const doc = buildRecoveryPdf({
      from,
      to,
      surgeryDate: activeSurgery?.surgery_date || null,
      days,
      entries,
      patientName: displayName(patient)
    });
    doc.save(`recovery-log-${from}_to_${to}.pdf`);
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Profile</h1>

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Patient</div>
          <div className="text-sm font-semibold break-words">Who this log belongs to.</div>
        </div>
        <div className="p-4">
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3 min-w-0 pb-2">
              <Field label="Patient first name">
                <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} className="nb-input" />
              </Field>
              <Field label="Patient last name">
                <input type="text" value={last} onChange={(e) => setLast(e.target.value)} className="nb-input" />
              </Field>
              <Field label="Date of birth" span hint="care team enter this to join">
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="nb-input" />
              </Field>
              <button
                className="col-span-2 nb-btn w-full h-12 bg-primary text-primary-foreground"
                onClick={savePatient}
                disabled={savingPatient || !first.trim() || !last.trim()}
              >
                {savingPatient ? "Saving…" : "Save patient"}
              </button>
            </div>
          ) : (
            <Row label="Patient" value={displayName(patient)} />
          )}
          <Row label="Signed in as" value={user?.email} />
          <Row label="Your access" value={isOwner ? "Patient — full access" : canWrite ? "Care team — can edit" : "Care team — read only"} />
          <Row label="Tracking" value={activeSurgery?.label} />
          <Row label="Surgery date" value={activeSurgery?.surgery_date ? fullDate(activeSurgery.surgery_date) : null} />
          <Row label="Surgeon" value={activeSurgery?.surgeon} />
        </div>
        <div className="px-4 pb-4">
          <button className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {isOwner && activeSurgery && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted">
            <div className="font-display text-xl uppercase leading-tight break-words">What to track</div>
            <div className="text-sm font-semibold break-words">
              For {activeSurgery.label}. Each surgery has its own.
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ORDER.map((t) => {
                const cfg = TYPES[t];
                if (!cfg) return null;
                const on = selected.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    disabled={savingTracking}
                    className="nb-chip"
                    style={on ? { backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" } : {}}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground break-words">
              {selected.length} of {QUICK_ORDER.length} selected. Turning one off hides its button; anything already
              logged stays.
            </p>

            <div className="border-t-2 pt-3 space-y-2">
              {[
                ["track_before", "Track days before surgery", "Log a baseline in the run-up."],
                ["track_after", "Track days from surgery onwards", "The recovery itself."]
              ].map(([key, label, hint]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => patchSurgery({ [key]: activeSurgery[key] === false })}
                  disabled={savingTracking}
                  className="nb-btn w-full min-h-12 px-3 justify-between text-left gap-3"
                  style={
                    activeSurgery[key] !== false
                      ? { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }
                      : {}
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate">{label}</span>
                    <span className="block text-[10px] font-semibold opacity-70 truncate">{hint}</span>
                  </span>
                  <span className="font-heading text-xs shrink-0">
                    {activeSurgery[key] !== false ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted">
            <div className="font-display text-xl uppercase leading-tight break-words">Care team</div>
            <div className="text-sm font-semibold break-words">
              They sign in with the email you add here, then confirm their date of birth.
            </div>
          </div>

          <div className="p-4 space-y-3">
            {team.length === 0 && <p className="text-sm text-muted-foreground">No one else has access yet.</p>}
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 min-w-0 border-b-2 last:border-b-0 pb-2 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{displayName(m) || m.email}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground truncate">
                    {m.email}{m.can_write === false ? " · read only" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="nb-btn h-11 w-11 shrink-0 bg-card"
                  aria-label={`Remove ${displayName(m) || m.email}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 min-w-0 pt-1">
              <Field label="Their email" span>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="name@example.com"
                  className="nb-input"
                />
              </Field>
              <Field label="Their first name">
                <input
                  type="text"
                  value={invite.first_name}
                  onChange={(e) => setInvite({ ...invite, first_name: e.target.value })}
                  className="nb-input"
                />
              </Field>
              <Field label="Their last name">
                <input
                  type="text"
                  value={invite.last_name}
                  onChange={(e) => setInvite({ ...invite, last_name: e.target.value })}
                  className="nb-input"
                />
              </Field>
              {inviteError && (
                <p className="col-span-2 text-sm font-bold text-destructive break-words">{inviteError}</p>
              )}
              <button
                className="col-span-2 nb-btn w-full h-12 bg-accent text-accent-foreground flex items-center justify-center gap-2"
                onClick={addMember}
              >
                <Plus className="w-4 h-4" />
                Add to care team
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Download a PDF</div>
          <div className="text-sm font-semibold break-words">A day or a range, paper-diary style.</div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
          <Field label="From">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="nb-input" />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="nb-input" />
          </Field>

          <p className="col-span-2 text-sm font-semibold text-center break-words">
            {tooWide ? (
              <span className="text-destructive">
                {spanDays} days is over the {MAX_RANGE_DAYS}-day limit — narrow the range.
              </span>
            ) : (
              `${spanDays} day${spanDays === 1 ? "" : "s"} in range`
            )}
          </p>

          <button
            className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground"
            onClick={generate}
            disabled={busy || !from || !to || tooWide}
          >
            {busy ? "Building PDF…" : "Download PDF"}
          </button>
          {done && !busy && <p className="col-span-2 text-sm font-bold text-center">PDF downloaded ✔</p>}
        </div>
      </div>
    </div>
  );
}
