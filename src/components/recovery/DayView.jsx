import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { sortEntries, runningTotals, computeTotals } from "@/lib/daySummary";
import { suggestFlags } from "@/lib/redFlags";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient, trackedTypes } from "@/lib/PatientContext";
import { defaultFocused, recordLabel } from "@/lib/scope";
import { remove, save } from "@/lib/saving";
import PullToRefresh from "@/components/PullToRefresh";
import QuickAdd from "./QuickAdd";
import DayFeed from "./DayFeed";
import EntryForm from "./EntryForm";
import DayHeader from "./DayHeader";
import DayTotals from "./DayTotals";
import RedFlagCheck from "./RedFlagCheck";
import QuestionsCard from "./QuestionsCard";
import RecordPicker from "./RecordPicker";

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function DayView({ date, startCollapsed }) {
  const { patientId, surgeries, scope, setScope, scopeRecords, canWrite, refreshSurgeries } = usePatient();
  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(!startCollapsed);
  const [lastBm, setLastBm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [arranging, setArranging] = useState(false);
  // The record new entries attach to, and whose day row (red flags, questions)
  // is shown. In single-record scope this is fixed to that record; in "all"
  // scope it is a choice, defaulting to maintenance.
  const [focusedId, setFocusedId] = useState(null);

  const multi = scopeRecords.length > 1;
  const focused = useMemo(() => {
    const list = scopeRecords;
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    return list.find((r) => r.id === focusedId) || defaultFocused(scope, surgeries);
  }, [scopeRecords, focusedId, scope, surgeries]);

  // Reset the focused pick when the scope changes so it never points at a
  // record that has dropped out of the view.
  useEffect(() => {
    if (!scopeRecords.length) { setFocusedId(null); return; }
    if (scopeRecords.length === 1) { setFocusedId(scopeRecords[0].id); return; }
    const def = defaultFocused(scope, surgeries);
    setFocusedId(def?.id || scopeRecords[0].id);
  }, [scope, surgeries]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!scopeRecords.length || !focused) {
      setDay(null);
      setEntries([]);
      return;
    }
    setLoadError(null);
    try {
      // Single-record scope reads one record; "all" reads every record on the
      // date by patient, so overlapping surgeries interleave on one rail.
      const dayQ = multi ? { date, patient_id: patientId } : { date, surgery_id: focused.id };
      const entQ = dayQ;
      const [dayRows, entryRows] = await Promise.all([
        base44.entities.RecoveryDay.filter(dayQ, "date", 200),
        base44.entities.RecoveryEntry.filter(entQ, "created_date", 1000)
      ]);
      const ds = asRows(dayRows);
      const es = asRows(entryRows);
      const mine = ds.find((d) => d.surgery_id === focused.id) ||
        (canWrite
          ? null
          : ds[0] || null);
      const d =
        mine ||
        (canWrite
          ? await base44.entities.RecoveryDay.create({
              date,
              patient_id: patientId,
              surgery_id: focused.id,
              mode: focused.mode
            })
          // A care team member cannot create this row — row security keys
          // create to write_patient_id and she never carries one — and
          // returning null left the page spinning for ever. Nobody could reach
          // an untouched date until the day arrows landed; now anyone can. An
          // unsaved stand-in renders the day read-only, which is the honest
          // screen, because there is genuinely nothing here.
          : { id: null, date, patient_id: patientId, surgery_id: focused.id, mode: focused.mode, unsaved: true });
      setDay(d);
      setEntries(es);
      // The bowel red flag counts days, so it needs the last one before today.
      const bmQ = multi ? { type: "bm", patient_id: patientId } : { type: "bm", surgery_id: focused.id };
      const bm = asRows(await base44.entities.RecoveryEntry.filter(bmQ, "-date", 5));
      setLastBm(bm.find((e) => e.date < date)?.date || null);
    } catch (e) {
      // This read also writes, so it can fail on a row-security refusal as well
      // as on a dropped connection. Either way the old code left entries at
      // null and the spinner turned for ever with nothing said.
      setLoadError(e?.message || "The day did not load.");
    }
  }, [date, patientId, focused, multi, canWrite, scopeRecords.length]);

  useEffect(() => {
    setDay(null);
    setEntries(null);
    setLoadError(null);
    load();
  }, [load]);

  // Nothing to log against: no record at all (a care team member on a patient
  // with none yet). Maintenance makes this rare, but it is still reachable.
  if (!scopeRecords.length || !focused) {
    return (
      <div className="nb-card p-4">
        <p className="text-sm font-semibold break-words">
          No record to log against yet. Add a surgery in Setup.
        </p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="nb-card p-4 space-y-3">
        <p className="text-sm font-bold break-words">This day did not load.</p>
        <p className="text-sm font-semibold text-muted-foreground break-words">{loadError}</p>
        <button type="button" className="nb-btn w-full h-12 bg-card" onClick={load}>
          Try again
        </button>
      </div>
    );
  }
  if (!day || entries === null) return <Spinner />;

  const sd = focused.surgery_date || null;
  const beforeSurgery = !!sd && date < sd;
  const loggable = beforeSurgery ? focused.track_before !== false : focused.track_after !== false;

  const sorted = sortEntries(entries);
  const run = runningTotals(sorted);
  const totals = computeTotals(entries, date);
  const suggestions = suggestFlags(entries, focused, lastBm, date);

  // Which records have something on this date, for the "all" header chip row.
  const recordsOnDate = multi
    ? scopeRecords.filter((r) => entries.some((e) => e.surgery_id === r.id))
    : [];

  // The dialog is held open until the write lands, and only then closed. It
  // used to close first and add the row optimistically, so a create that failed
  // on bad wifi showed the entry, dropped it on the next load() and said
  // nothing: the patient's memory was the only record it had been typed. There
  // is nothing to be optimistic about while the dialog is open anyway — it
  // covers the feed the row would appear on — and what she typed is still on
  // screen to retry. The `saving` flag was already wired through EntryForm and
  // CheckinStack and never set, so a second tap on Save wrote a second entry.
  //
  // Retry sends exactly the entry that was tapped Save on, not whatever the
  // form says by the time it is pressed. Editing the form and then tapping Save
  // again is the way to change it.
  const saveEntry = async (payload) => {
    const target = dialog;
    if (!target) return;
    const attempt = async () => {
      setSaving(true);
      const res = await save(
        () =>
          target.entry
            ? base44.entities.RecoveryEntry.update(target.entry.id, payload)
            : base44.entities.RecoveryEntry.create({
                date,
                type: target.type,
                patient_id: patientId,
                surgery_id: focused.id,
                mode: focused.mode,
                ...payload
              }),
        { what: "Your entry", retry: attempt }
      );
      setSaving(false);
      if (!res.ok) return;
      setDialog(null);
      load();
    };
    await attempt();
  };

  const deleteEntry = async () => {
    const gone = dialog?.entry;
    if (!gone) return;
    const attempt = async () => {
      setSaving(true);
      // The row stays on the feed until the delete is confirmed. A row that
      // disappears and comes back on the next load is worse than one that
      // waits.
      const res = await remove(() => base44.entities.RecoveryEntry.delete(gone.id), {
        what: "Your entry",
        retry: attempt
      });
      setSaving(false);
      if (!res.ok) return;
      setDialog(null);
      load();
    };
    await attempt();
  };

  const saveOrder = async (order) => {
    const res = await save(() => base44.entities.Surgery.update(focused.id, { tracked_types: order }), {
      what: "Your tracker order",
      saved: "The buttons keep this order.",
      retry: () => saveOrder(order)
    });
    // Refreshed either way: the read is the only thing that says what is
    // actually stored. QuickAdd keeps the order you dragged on screen until it
    // is remounted, which is part of why the Retry offer matters here.
    await refreshSurgeries();
    return res.ok;
  };

  return (
    <PullToRefresh onRefresh={load}>
      <div className="space-y-4">
      <DayHeader
        date={date}
        day={day}
        focused={focused}
        scope={scope}
        onScope={setScope}
        surgeries={surgeries}
        recordsOnDate={recordsOnDate}
        onPickRecord={(id) => setScope({ all: false, ids: [id] })}
      />

      <div>
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          aria-expanded={addOpen}
          data-orient="firstcheckin"
          className="w-full flex items-center gap-1.5 mb-2"
        >
          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${addOpen ? "rotate-90" : ""}`} />
          <h2 className="font-heading text-sm uppercase tracking-wider">Log an entry</h2>
        </button>
        {/* Arrange mode was a 450ms long press documented only in a code
            comment. Good feature, nobody would find it. */}
        {addOpen && canWrite && loggable && (
          <button
            type="button"
            onClick={() => setArranging(true)}
            className="absolute right-0 top-0 h-11 px-2 font-heading text-xs uppercase tracking-wider text-muted-foreground"
          >
            Edit
          </button>
        )}
        {!addOpen ? null : loggable ? (
          <div className="space-y-2">
            {multi && (
              <RecordPicker
                records={scopeRecords}
                value={focused.id}
                onChange={setFocusedId}
              />
            )}
            <QuickAdd
              types={trackedTypes(focused)}
              onAdd={(type) => setDialog({ type })}
              onReorder={saveOrder}
              canWrite={canWrite}
              arranging={arranging}
              onArrangingChange={setArranging}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card break-words">
            {beforeSurgery
              ? "Not tracking days before this surgery. Turn that on in Profile."
              : "Not tracking days from this surgery onwards. Turn that on in Profile."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-sm uppercase tracking-wider">
          {multi ? "The page · all records" : "The page"}
        </h2>
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
            Nothing logged today. Tap a tracker above to start.
          </p>
        )}
        {sorted.length > 0 && (
          <DayFeed
            entries={sorted}
            run={run}
            surgery={focused}
            onEdit={canWrite ? (e) => setDialog({ entry: e }) : undefined}
            tagWith={multi ? (e) => recordLabel(scopeRecords.find((r) => r.id === e.surgery_id)) : null}
          />
        )}
      </div>

      <DayTotals totals={totals} day={day} surgery={focused} />

      <RedFlagCheck
        key={day.id + JSON.stringify(day.red_flag_answers || {}) + JSON.stringify(day.red_flag_details || {})}
        day={day}
        suggestions={suggestions}
        onSaved={load}
        canWrite={canWrite}
        record={focused}
      />

      <QuestionsCard
        key={day.id + JSON.stringify(day.questions || [])}
        day={day}
        onSaved={load}
        canWrite={canWrite}
      />

      {/* Not dismissible while the write is in flight: the swipe-away or the
          Escape key would take the only copy of what she typed with it. */}
      <Dialog open={!!dialog} onOpenChange={(o) => !o && !saving && setDialog(null)}>
        <DialogContent
          className="max-w-lg max-h-[92vh] overflow-y-auto"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {dialog && (
            <EntryForm
              type={dialog.entry ? dialog.entry.type : dialog.type}
              entry={dialog.entry}
              saving={saving}
              onSave={saveEntry}
              onCancel={() => setDialog(null)}
              onDelete={dialog.entry ? deleteEntry : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PullToRefresh>
  );
}