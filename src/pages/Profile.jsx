import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Plus, X } from "lucide-react";
import { todayStr, daysBetween, MAX_RANGE_DAYS } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, trackedTypes } from "@/lib/PatientContext";
import { GarmentLibrary, MedGroupLibrary } from "@/components/recovery/Libraries";
import {
  TYPES, PINNED, QUICK_ORDER, CHECKIN_MEASURES, DEFAULT_CHECKIN_SLOTS,
  NUTRIENTS, BODYWORK_GOAL, nutrientUnit
} from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
import { buildRecoveryPdf } from "@/lib/recoveryPdf";
import Field from "@/components/Field";
import TimeInput from "@/components/recovery/TimeInput";

// What the patient actually has saved, blank rows and all. The check-in form
// reads through checkinSlots(), which drops the blanks; the editor must not.
const savedSlots = (patient) => {
  const saved = Array.isArray(patient?.checkin_slots) ? patient.checkin_slots : [];
  return saved.length ? saved : DEFAULT_CHECKIN_SLOTS;
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { me, patient, patientId, isOwner, canWrite, refreshPatient, surgeries, activeSurgery, activeSurgeryId, selectSurgery, refreshSurgeries } = usePatient();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [scope, setScope] = useState("surgery");
  const [groupBy, setGroupBy] = useState("surgery");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);


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
  // rather than toggled: how often it asks, and what it asks for. It belongs to
  // the patient rather than a surgery, because how often you are asked how you
  // feel does not change because a second operation was added.
  const [savingCheckin, setSavingCheckin] = useState(false);
  // The editor holds its own list. checkinSlots() drops any slot without a
  // label, which is right for the check-in form and wrong here: a row you have
  // just added has no label yet, so reading through it made "Add a time" look
  // like it did nothing.
  const [slots, setSlotsLocal] = useState(() => savedSlots(patient));
  useEffect(() => {
    setSlotsLocal(savedSlots(patient));
    // Seeded per patient. Saving reuses the same row, so this must not re-run
    // on every write or it would stomp the row being typed into.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);
  const measures = patient?.checkin_measures?.length
    ? patient.checkin_measures
    : CHECKIN_MEASURES.map((m) => m.key);

  const patchPatient = async (fields) => {
    if (!patient) return;
    setSavingCheckin(true);
    await base44.entities.AppUser.update(patient.id, fields);
    await refreshPatient();
    setSavingCheckin(false);
  };

  const setSlots = (next) => {
    setSlotsLocal(next);
    patchPatient({ checkin_slots: next });
  };

  const toggleMeasure = (key) => {
    const next = measures.includes(key) ? measures.filter((k) => k !== key) : [...measures, key];
    // Stored in the order the check-in asks, so the form never reshuffles.
    patchPatient({ checkin_measures: CHECKIN_MEASURES.filter((m) => next.includes(m.key)).map((m) => m.key) });
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
    const wanted = scope === "all" ? surgeries : surgeries.filter((sx) => sx.id === activeSurgeryId);
    // One read per surgery rather than a filter the backend cannot express as
    // "any of these".
    const per = await Promise.all(
      wanted.map((sx) =>
        Promise.all([
          base44.entities.RecoveryDay.filter({ surgery_id: sx.id }, "date", 500),
          base44.entities.RecoveryEntry.filter({ surgery_id: sx.id }, "created_date", 3000)
        ])
      )
    );
    const [team, garments, medGroups] = await Promise.all([
      base44.entities.AppUser.filter({ patient_id: patientId, kind: "team_member" }, "created_date", 50),
      base44.entities.Garment.list("sort_order", 100),
      base44.entities.MedGroup.list("sort_order", 100)
    ]);

    const doc = buildRecoveryPdf({
      from,
      to,
      days: per.flatMap(([d]) => asRows(d)),
      entries: per.flatMap(([, e]) => asRows(e)),
      patientName: displayName(patient),
      surgeries: wanted,
      team: asRows(team),
      garments: asRows(garments),
      medGroups: asRows(medGroups),
      groupBy
    });
    doc.save(`lipnode-${from}_to_${to}.pdf`);
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Setup</h1>

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2" style={{ backgroundColor: TYPES[PINNED].color, color: "#fff" }}>
            <div className="font-display text-xl uppercase leading-tight break-words">Check-in</div>
            <div className="text-sm font-semibold break-words">The same for every surgery.</div>
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
                  <TimeInput
                    small
                    value={slot.time || ""}
                    onChange={(t) => setSlots(slots.map((x, j) => (j === i ? { ...x, time: t } : x)))}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${slot.label || "this time"}`}
                    onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                    disabled={savingCheckin || slots.length === 1}
                    className="nb-btn w-11 shrink-0 bg-card"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSlots([...slots, { label: "", time: "" }])}
                disabled={savingCheckin}
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
                    disabled={savingCheckin || (measures.length === 1 && measures.includes(m.key))}
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

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Download a PDF</div>
          <div className="text-sm font-semibold break-words">
            A day or a range. Carries the surgery, goals, care team, garments, med groups, trends,
            red flags and questions.
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
          <Field label="From">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="nb-input" />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="nb-input" />
          </Field>

          {surgeries.length > 1 && (
            <>
              <div className="col-span-2 space-y-1.5">
                <div className="nb-label">Which surgery</div>
                <div className="flex gap-1.5">
                  {[
                    ["surgery", "This one"],
                    ["all", "All of them"]
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScope(k)}
                      aria-pressed={scope === k}
                      className="nb-chip flex-1 justify-center"
                      style={scope === k ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {scope === "all" && (
                <div className="col-span-2 space-y-1.5">
                  <div className="nb-label">How to lay them out</div>
                  <div className="flex gap-1.5">
                    {[
                      ["surgery", "By surgery"],
                      ["timeline", "One timeline"]
                    ].map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setGroupBy(k)}
                        aria-pressed={groupBy === k}
                        className="nb-chip flex-1 justify-center"
                        style={groupBy === k ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground break-words">
                    By surgery runs each one end to end. One timeline puts every day in date order and
                    names the surgery on each.
                  </p>
                </div>
              )}
            </>
          )}

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
