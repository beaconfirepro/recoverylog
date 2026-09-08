import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, LogOut, Plus, X } from "lucide-react";
import { todayStr, daysBetween, MAX_RANGE_DAYS } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, trackedTypes, sameEmail } from "@/lib/PatientContext";
import { GarmentLibrary, MedGroupLibrary } from "@/components/recovery/Libraries";
import DeleteAccount from "@/components/DeleteAccount";
import LegalSection from "@/components/legal/LegalSection";
import SignInMethod from "@/components/legal/SignInMethod";
import MyLogs from "@/components/legal/MyLogs";
import { THEMES, useTheme } from "@/lib/theme";
import {
  TYPES, PINNED, QUICK_ORDER, CHECKIN_MEASURES, checkinSlots,
  NUTRIENTS, BODYWORK_GOAL, nutrientUnit
} from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
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
  const { theme, choose } = useTheme();
  const { me, patient, patientId, isOwner, canWrite, refreshPatient, surgeries, activeSurgery, activeSurgeryId, selectSurgery, refreshSurgeries } = usePatient();
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
    base44.entities.AppUser.filter({ patient_id: patientId, kind: "team_member" }, "created_date", 50).then((r) => setTeam(asRows(r)));
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
    if (team.some((m) => sameEmail(m.email, email))) {
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

  // The check-in is not one of the buttons you turn off, so it is configured
  // rather than toggled: how often it asks, and what it asks for.
  const slots = checkinSlots(activeSurgery);
  const measures = activeSurgery?.checkin_measures?.length
    ? activeSurgery.checkin_measures
    : CHECKIN_MEASURES.map((m) => m.key);

  const setSlots = (next) => patchSurgery({ checkin_slots: next });

  const toggleMeasure = (key) => {
    const next = measures.includes(key) ? measures.filter((k) => k !== key) : [...measures, key];
    // Stored in the order the check-in asks, so the form never reshuffles.
    patchSurgery({ checkin_measures: CHECKIN_MEASURES.filter((m) => next.includes(m.key)).map((m) => m.key) });
  };

  // A goal turns that tracker's pill into a bar on the day page. Only the three
  // you are trying to reach a number on take one; the rest are just recorded.
  const goals = activeSurgery?.goals || {};
  const setGoal = (key, raw) => {
    const n = raw === "" ? null : +raw;
    patchSurgery({ goals: { ...goals, [key]: Number.isFinite(n) && n > 0 ? n : null } });
  };
  const setNutrientGoal = (name, raw) => {
    const n = raw === "" ? null : +raw;
    patchSurgery({
      goals: { ...goals, nutrients: { ...(goals.nutrients || {}), [name]: Number.isFinite(n) && n > 0 ? n : null } }
    });
  };

  // Which trackers are summarised on the History card. A tracker turned off
  // cannot be on the card, so switching it off drops it from here too.
  const onHistory = activeSurgery?.history_types || [];
  const toggleHistory = (t) => {
    const next = onHistory.includes(t) ? onHistory.filter((x) => x !== t) : [...onHistory, t];
    patchSurgery({ history_types: QUICK_ORDER.filter((x) => next.includes(x)) });
  };

  const toggleType = (t) => {
    const next = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
    // Keep the arranged order: a newly ticked type joins the end rather than
    // jumping to wherever the built-in list happens to put it.
    patchSurgery(
      selected.includes(t)
        ? { tracked_types: next, history_types: onHistory.filter((x) => x !== t) }
        : { tracked_types: next }
    );
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

      {/* You, not the patient. A care team member's profile is their own
          account; whose log they are reading is on the home page and in the
          bar at the top, where it belongs. */}
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">
            {isOwner ? "You, the patient" : "You"}
          </div>
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
              <Field label="Date of birth" span hint="your care team confirm this">
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
            <Row label="Your name" value={displayName(me)} />
          )}
          <Row label="Signed in as" value={user?.email} />
          <Row label="Your access" value={isOwner ? "Patient, full access" : canWrite ? "Care team, can edit" : "Care team, read only"} />
        </div>
        <div className="px-4 pb-4">
          <button className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <MyLogs />

      {isOwner && activeSurgery && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2" style={{ backgroundColor: TYPES[PINNED].color, color: "#fff" }}>
            <div className="font-display text-xl uppercase leading-tight break-words">Check-in</div>
            <div className="text-sm font-semibold break-words">For {activeSurgery.label}.</div>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="nb-label">How often, and when</div>
              {slots.map((slot, i) => (
                <div key={i} className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    value={slot.label}
                    placeholder="e.g. Waking"
                    onChange={(e) =>
                      setSlots(slots.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                    }
                    className="nb-input flex-1 min-w-0"
                  />
                  <input
                    type="time"
                    value={slot.time || ""}
                    onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                    className="nb-input w-32 shrink-0"
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${slot.label || "this time"}`}
                    onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                    disabled={savingTracking || slots.length === 1}
                    className="nb-btn w-11 shrink-0 bg-card"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSlots([...slots, { label: "", time: "" }])}
                disabled={savingTracking}
                className="nb-btn w-full h-11 bg-accent text-accent-foreground flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add a time
              </button>
              <p className="text-[11px] font-semibold text-muted-foreground break-words">
                The time picks the slot when you open the form.
              </p>
            </div>

            <div className="border-t-2 pt-3 space-y-2">
              <div className="nb-label">What it records</div>
              <div className="flex flex-wrap gap-1.5">
                {CHECKIN_MEASURES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleMeasure(m.key)}
                    disabled={savingTracking || (measures.length === 1 && measures.includes(m.key))}
                    className="nb-chip"
                    style={measures.includes(m.key) ? { backgroundColor: TYPES[PINNED].color, color: "#fff" } : {}}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground break-words">
                Turning one off keeps what is already recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {isOwner && activeSurgery && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted space-y-2">
            <div>
              <div className="font-display text-xl uppercase leading-tight break-words">What to track</div>
              <div className="text-sm font-semibold break-words">Each surgery is set up on its own.</div>
            </div>
            {/* The settings below belong to one surgery, so the surgery being
                set up is picked here rather than inferred from another page. */}
            <select
              aria-label="Surgery being set up"
              value={activeSurgeryId || ""}
              onChange={(e) => selectSurgery(e.target.value)}
              className="nb-select"
            >
              {surgeries
                .filter((x) => !x.archived || x.id === activeSurgeryId)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                    {x.archived ? " (archived)" : ""}
                  </option>
                ))}
            </select>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground break-words">
              History shows a tracker on each day's card. Turning one off keeps what is already logged.
            </p>
            <div className="flex items-center gap-2 min-w-0 pb-1 border-b-2">
              <span className="flex-1 min-w-0" />
              <span className="nb-label w-14 shrink-0 text-center text-muted-foreground">Track</span>
              <span className="nb-label w-14 shrink-0 text-center text-muted-foreground">History</span>
            </div>
            <div className="divide-y-2">
              {QUICK_ORDER.map((t) => {
                const cfg = TYPES[t];
                if (!cfg) return null;
                const on = selected.includes(t);
                return (
                  <div key={t} className="flex items-center gap-2 min-w-0 py-1.5">
                    <span className="w-4 h-4 shrink-0 border-2 rounded-md" style={{ backgroundColor: cfg.color }} />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold">{cfg.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`Track ${cfg.label}`}
                      onClick={() => toggleType(t)}
                      disabled={savingTracking}
                      className="w-14 h-8 shrink-0 border-2 rounded-full relative"
                      style={on ? { backgroundColor: cfg.color } : { backgroundColor: "hsl(var(--muted))" }}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 border-2 rounded-full bg-card transition-all ${on ? "left-7" : "left-1"}`}
                      />
                    </button>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={onHistory.includes(t)}
                      aria-label={`Show ${cfg.label} on history card`}
                      onClick={() => toggleHistory(t)}
                      disabled={savingTracking || !on}
                      className="w-14 h-8 shrink-0 grid place-items-center disabled:opacity-30"
                    >
                      <span
                        className="w-6 h-6 border-2 rounded-md grid place-items-center"
                        style={onHistory.includes(t) ? { backgroundColor: cfg.color } : {}}
                      >
                        {onHistory.includes(t) && <Check className="w-4 h-4" strokeWidth={3.5} />}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t-2 pt-3 space-y-2">
              <div className="nb-label">Goals</div>
              <p className="text-[11px] font-semibold text-muted-foreground break-words">
                Leave one blank for no target.
              </p>
              {[TYPES.water.goal, BODYWORK_GOAL].map((g) => (
                <div key={g.key} className="flex items-center gap-2 min-w-0">
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold">{g.label}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder={String(g.suggest)}
                    defaultValue={goals[g.key] ?? ""}
                    onBlur={(e) => setGoal(g.key, e.target.value)}
                    disabled={savingTracking}
                    className="nb-input w-24 shrink-0"
                  />
                  <span className="nb-label w-8 shrink-0 text-muted-foreground">{g.unit}</span>
                </div>
              ))}
              <div className="nb-label pt-1">Per nutrient</div>
              {NUTRIENTS.map((n) => (
                <div key={n.name} className="flex items-center gap-2 min-w-0">
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold">{n.name}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    defaultValue={goals.nutrients?.[n.name] ?? ""}
                    onBlur={(e) => setNutrientGoal(n.name, e.target.value)}
                    disabled={savingTracking}
                    className="nb-input w-24 shrink-0"
                  />
                  <span className="nb-label w-8 shrink-0 text-muted-foreground">{nutrientUnit(n.name)}</span>
                </div>
              ))}
            </div>

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

      {isOwner && <GarmentLibrary />}

      {isOwner && <MedGroupLibrary />}

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted">
            <div className="font-display text-xl uppercase leading-tight break-words">Care team</div>
            <div className="text-sm font-semibold break-words">
              They sign in with this email, then confirm your name and date of birth.
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
          <div className="text-sm font-semibold break-words">A day or a range.</div>
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

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Appearance</div>
                  </div>
        <div className="p-4 flex gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => choose(t)}
              aria-pressed={theme === t}
              className="nb-chip flex-1 justify-center capitalize"
              style={theme === t ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <SignInMethod />

      <LegalSection />

      <DeleteAccount isOwner={isOwner} />
    </div>
  );
}
