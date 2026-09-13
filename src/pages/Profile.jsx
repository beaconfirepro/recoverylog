import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, ChevronRight, Plus, X } from "lucide-react";
import { todayStr, daysBetween, MAX_RANGE_DAYS } from "@/lib/dates";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, trackedTypes } from "@/lib/PatientContext";
import { isMaintenance } from "@/lib/scope";
import { GarmentLibrary, MedGroupLibrary } from "@/components/recovery/Libraries";
import {
  TYPES, PINNED, QUICK_ORDER, CHECKIN_MEASURES, DEFAULT_CHECKIN_SLOTS,
  MEASUREMENTS, NUTRIENTS, BODYWORK_GOAL, nutrientUnit
} from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
import { fetchAllRows } from "@/lib/paging";
import { buildRecoveryPdf } from "@/lib/recoveryPdf";
import { save } from "@/lib/saving";
import Field from "@/components/Field";
import TimeInput from "@/components/recovery/TimeInput";
import Surgeries from "@/components/care/Surgeries";
import { useOrientationHighlight, useOrientationTour } from "@/lib/useOrientationHighlight";
import TourOverlay from "@/components/orientation/TourOverlay";
import { useDismissKeyboard } from "@/lib/dismissKeyboard";

// What the patient actually has saved, blank rows and all. The check-in form
// reads through checkinSlots(), which drops the blanks; the editor must not.
const savedSlots = (patient) => {
  const saved = Array.isArray(patient?.checkin_slots) ? patient.checkin_slots : [];
  return saved.length ? saved : DEFAULT_CHECKIN_SLOTS;
};

export default function Profile() {
  const navigate = useNavigate();
  useOrientationHighlight();
  // Setup is where the checklist sends people, so it is where the tours run.
  const { tour, clear: clearTour } = useOrientationTour();
  // Setup is the one screen that is mostly numeric fields.
  useDismissKeyboard();
  const { user, logout } = useAuth();
  const { me, patient, patientId, isOwner, canWrite, refreshPatient, surgeries, activeSurgery, activeSurgeryId, selectSurgery, refreshSurgeries } = usePatient();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [newSpot, setNewSpot] = useState("");
  const [scope, setScope] = useState("surgery");
  const [groupBy, setGroupBy] = useState("surgery");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);


  // Tracking settings belong to a surgery, not the person: a knee and a tummy
  // tuck do not want the same buttons.
  const [savingTracking, setSavingTracking] = useState(false);
  const selected = trackedTypes(activeSurgery);

  // Every toggle on this page is a write, and none of them said a word when
  // one failed: the switch flicked back on the next read and that was the whole
  // report. The retry defaults to sending the same fields again, and a caller
  // holding its own copy of the value passes its own so the retry puts that
  // copy back too.
  const patchSurgery = async (fields, opts = {}) => {
    if (!activeSurgery) return false;
    setSavingTracking(true);
    const res = await save(() => base44.entities.Surgery.update(activeSurgery.id, fields), {
      what: "Your tracking",
      saved: "This surgery keeps the change.",
      retry: opts.retry || (() => patchSurgery(fields, opts)),
      quiet: opts.quiet
    });
    await refreshSurgeries();
    setSavingTracking(false);
    return res.ok;
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

  const patchPatient = async (fields, opts = {}) => {
    if (!patient) return false;
    setSavingCheckin(true);
    const res = await save(() => base44.entities.AppUser.update(patient.id, fields), {
      what: "Your setup",
      saved: "The change is saved.",
      retry: opts.retry || (() => patchPatient(fields, opts)),
      quiet: opts.quiet
    });
    await refreshPatient();
    setSavingCheckin(false);
    return res.ok;
  };

  // The editor holds the times itself, so a failed write has to put the rows
  // back: leaving a time on screen that was never saved is how a check-in ends
  // up asking at an hour nothing is stored against. The retry re-applies the
  // new rows first, so a save that works on the second try leaves the editor
  // agreeing with the record again.
  const setSlots = (next) => {
    const previous = slots;
    const attempt = async () => {
      setSlotsLocal(next);
      if (!(await patchPatient({ checkin_slots: next }, { retry: attempt }))) setSlotsLocal(previous);
    };
    attempt();
  };

  // Empty means the built-in set, the same way the check-in slots work.
  const spots = patient?.measurements?.length
    ? patient.measurements.filter(Boolean)
    : MEASUREMENTS.map((m) => m.name);
  const custom = spots.filter((name) => !MEASUREMENTS.some((m) => m.name === name));

  const toggleSpot = (name) => {
    const next = spots.includes(name) ? spots.filter((s) => s !== name) : [...spots, name];
    if (!next.length) return;
    patchPatient({ measurements: next });
  };

  // The box keeps what was typed until the write lands: clearing it first and
  // then failing loses the name as well as the spot.
  const addSpot = async () => {
    const name = newSpot.trim();
    if (!name || spots.includes(name)) return;
    if (await patchPatient({ measurements: [...spots, name] })) setNewSpot("");
  };

  const toggleMeasure = (key) => {
    const next = measures.includes(key) ? measures.filter((k) => k !== key) : [...measures, key];
    // Stored in the order the check-in asks, so the form never reshuffles.
    patchPatient({ checkin_measures: CHECKIN_MEASURES.filter((m) => next.includes(m.key)).map((m) => m.key) }, { quiet: true });
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

  // Which trackers are summarised on the day card. A tracker turned off
  // cannot be on the card, so switching it off drops it from here too.
  const onHistory = activeSurgery?.history_types || [];
  const toggleHistory = (t) => {
    const next = onHistory.includes(t) ? onHistory.filter((x) => x !== t) : [...onHistory, t];
    patchSurgery({ history_types: QUICK_ORDER.filter((x) => next.includes(x)) }, { quiet: true });
  };

  const toggleType = (t) => {
    const next = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
    // Keep the arranged order: a newly ticked type joins the end rather than
    // jumping to wherever the built-in list happens to put it.
    patchSurgery(
      selected.includes(t)
        ? { tracked_types: next, history_types: onHistory.filter((x) => x !== t) }
        : { tracked_types: next },
      { quiet: true }
    );
  };

  // dateRange() stops at MAX_RANGE_DAYS. Silently dropping days out of a record
  // meant for a surgeon is worse than refusing, so block the export instead.
  const spanDays = daysBetween(from, to) + 1;
  const tooWide = spanDays > MAX_RANGE_DAYS;

  const generate = async () => {
    setBusy(true);
    setDone(false);
    const build = async () => {
      const wanted = scope === "all" ? surgeries : surgeries.filter((sx) => sx.id === activeSurgeryId);
      // One read per surgery rather than a filter the backend cannot express as
      // "any of these".
      // Paged, not capped. A single filter() answers with one page, so 500
      // days and 3,000 entries were a silent ceiling: past it the PDF built,
      // looked complete, and went to a surgeon with days missing out of the
      // middle. MAX_RANGE_DAYS below refuses a wide date range for exactly
      // that reason and could not see this, because a few months of heavy
      // logging passes 3,000 entries inside a narrow one.
      const per = await Promise.all(
        wanted.map((sx) =>
          Promise.all([
            fetchAllRows(base44.entities.RecoveryDay, { surgery_id: sx.id }, "date", 500),
            fetchAllRows(base44.entities.RecoveryEntry, { surgery_id: sx.id }, "created_date", 2000)
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
        days: per.flatMap(([d]) => d),
        entries: per.flatMap(([, e]) => e),
        patientName: displayName(patient),
        surgeries: wanted,
        team: asRows(team),
        garments: asRows(garments),
        medGroups: asRows(medGroups),
        groupBy
      });
      doc.save(`lipnode-${from}_to_${to}.pdf`);
    };
    // Quiet on success: the line under the button already says it arrived, so
    // this only announces it for a screen reader, which cannot see that line.
    // On failure it is the same toast as everything else — a PDF that silently
    // never appeared looked identical to one still being built.
    const res = await save(build, {
      what: "The PDF",
      saved: "The PDF is downloaded.",
      quiet: true,
      title: "The PDF didn't build",
      advice: "Tap Retry to build it again.",
      retry: generate
    });
    setBusy(false);
    setDone(res.ok);
  };

  return (
    <div className="space-y-4">
      {tour && <TourOverlay tour={tour} onDone={clearTour} />}

      <h1 className="font-display text-2xl uppercase">Setup</h1>

      {/* Care is about people. This is about records, and it sits here because
          everything below configures one of them — a patient with no care team
          should not have to go to a tab about other people to add a surgery. */}
      <Surgeries />

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted">
            <div className="font-display text-xl uppercase leading-tight break-words">Getting started</div>
            <div className="text-sm font-semibold break-words">
              The welcome checklist. Open it again any time.
            </div>
          </div>
          <div className="p-4">
            <button
              type="button"
              className="nb-btn w-full h-12 bg-primary text-primary-foreground"
              onClick={() => navigate("/?orientation=1")}
            >
              Open the guided tour
            </button>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="nb-card overflow-hidden">
          {/* The tour lights the header, title and subtitle together: "the same
              for every surgery" is the half that answers what the card is. */}
          <div
            data-tour="checkin-card"
            data-gtour="checkin-card"
            className="px-4 py-3 border-b-2"
            style={{ backgroundColor: TYPES[PINNED].color, color: "#fff" }}
          >
            <div className="font-display text-xl uppercase leading-tight break-words" data-orient="checkins">Check-in</div>
            <div className="text-sm font-semibold break-words">The same for every surgery.</div>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2" data-tour="checkin-times" data-gtour="checkin-times">
              <div className="nb-label">How often, and when</div>
              {/* Only the first row carries checkin-remove. The tour circles one
                  of these and one is the point: the line says "delete any you
                  don't need", not all of them. */}
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
                    data-tour={i === 0 ? "checkin-remove" : undefined}
                    data-gtour={i === 0 ? "checkin-remove" : undefined}
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
                data-tour="checkin-add"
                data-gtour="checkin-add"
                className="nb-btn w-full h-11 bg-accent text-accent-foreground flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add a time
              </button>
              <p className="text-2xs font-semibold text-muted-foreground break-words">
                The time picks the slot when you open the form.
              </p>
            </div>

            <div className="border-t-2 pt-3 space-y-2" data-tour="checkin-records" data-gtour="checkin-records">
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
              <p className="text-2xs font-semibold text-muted-foreground break-words">
                Turning one off keeps what is already recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {isOwner && activeSurgery && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted space-y-2" data-gtour="trackers-header">
            <div>
              <div className="font-display text-xl uppercase leading-tight break-words" data-orient="trackers">What to track</div>
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
            <p className="text-2xs font-semibold text-muted-foreground break-words">
              Day by Day shows a tracker on each day's card. Turning one off keeps what is already logged.
            </p>
            <div className="flex items-center gap-2 min-w-0 pb-1 border-b-2">
              <span className="flex-1 min-w-0" />
              <span className="nb-label w-14 shrink-0 text-center text-muted-foreground">Track</span>
              <span className="nb-label w-14 shrink-0 text-center text-muted-foreground">Card</span>
            </div>
            {/* The two controls are a switch and a checkbox — different things,
                and correctly different roles — but they are the same size and
                sit side by side, and one gates the other with nothing on screen
                saying so. A greyed box with no reason is a control that looks
                broken. */}
            <p id="track-gate" className="text-xs font-semibold text-muted-foreground break-words">
              A tracker has to be on before it can show on the day card.
            </p>
            <div className="divide-y-2">
              {QUICK_ORDER.map((t) => {
                const cfg = TYPES[t];
                if (!cfg) return null;
                const on = selected.includes(t);
                return (
                  <div key={t} className="flex items-center gap-2 min-w-0 py-1.5" data-gtour={t === "water" ? "trackers-water" : undefined}>
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
                      aria-label={`Show ${cfg.label} on the day card`}
                      aria-describedby={on ? undefined : "track-gate"}
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

            <div className="border-t-2 pt-3 space-y-2" data-gtour="trackers-goals">
              <div className="nb-label">Goals</div>
              <p className="text-2xs font-semibold text-muted-foreground break-words">
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

            {!isMaintenance(activeSurgery) && (
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
                    <span className="block text-2xs font-semibold opacity-70 truncate">{hint}</span>
                  </span>
                  <span className="font-heading text-xs shrink-0">
                    {activeSurgery[key] !== false ? "ON" : "OFF"}
                  </span>
                </button>
              ))}
            </div>
            )}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted" data-gtour="measurements-header">
            <div className="font-display text-xl uppercase leading-tight break-words" data-orient="measurements">Measurements</div>
            <div className="text-sm font-semibold break-words">
              What the measurements tracker asks for, in this order.
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-1.5" data-gtour="measurements-spots">
              {MEASUREMENTS.map((m) => {
                const on = spots.includes(m.name);
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => toggleSpot(m.name)}
                    aria-pressed={on}
                    disabled={savingCheckin || (on && spots.length === 1)}
                    className="nb-chip"
                    style={on ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>

            {/* Anything she measures that the built-in list does not name. Single
                figure: nothing else knows a spot she invented has two sides. */}
            {custom.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {custom.map((name) => (
                  <span key={name} className="nb-chip gap-1.5" style={{ backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}>
                    {name}
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => toggleSpot(name)}
                      disabled={savingCheckin}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 min-w-0" data-gtour="measurements-add">
              <input
                type="text"
                value={newSpot}
                onChange={(e) => setNewSpot(e.target.value)}
                placeholder="e.g. Left ankle bone"
                className="nb-input flex-1 min-w-0"
              />
              <button
                type="button"
                className="nb-btn h-11 px-4 shrink-0 bg-accent text-accent-foreground flex items-center gap-1.5"
                onClick={addSpot}
                disabled={savingCheckin || !newSpot.trim()}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <p className="text-xs font-semibold text-muted-foreground break-words">
              Turning one off keeps what is already recorded.
            </p>
          </div>
        </div>
      )}

      {isOwner && <GarmentLibrary />}

      {isOwner && <MedGroupLibrary />}

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted" data-gtour="pdf-header">
          <div className="font-display text-xl uppercase leading-tight break-words" data-orient="pdf">Download a PDF</div>
          <div className="text-sm font-semibold break-words">
            A day or a range. Carries the surgery, goals, care team, garments, med groups, trends,
            red flags and questions.
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0" data-gtour="pdf-range">
          <Field label="From">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="nb-input" />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="nb-input" />
          </Field>

          {surgeries.length > 1 && (
            <>
              <div className="col-span-2 space-y-1.5">
                <div className="nb-label">Which record</div>
                <div className="flex gap-1.5">
                  {[
                    ["surgery", "This record"],
                    ["all", "All records"]
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
                      ["surgery", "By record"],
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
                    By record runs each one end to end. One timeline puts every day in date order and
                    names the record on each.
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
            data-gtour="pdf-download"
            onClick={generate}
            disabled={busy || !from || !to || tooWide}
          >
            {busy ? "Building PDF…" : "Download PDF"}
          </button>
          {done && !busy && <p className="col-span-2 text-sm font-bold text-center">PDF downloaded ✔</p>}
        </div>
      </div>

      {/* Setup is the log, You is the person. The rule is sound and was
          invisible — and You is the only destination not in the tab bar, so
          somebody looking for it has nothing to follow. */}
      <Link to="/me" className="nb-card block p-4 flex items-center gap-2 min-w-0">
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold break-words">
            Looking for your account, how the app looks, or the documents you agreed to?
          </span>
          <span className="block nb-label text-muted-foreground mt-0.5">You</span>
        </span>
        <ChevronRight className="w-5 h-5 shrink-0" />
      </Link>

    </div>
  );
}