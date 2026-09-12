import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { sortEntries, runningTotals, computeTotals } from "@/lib/daySummary";
import { suggestFlags } from "@/lib/redFlags";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient, trackedTypes } from "@/lib/PatientContext";
import { defaultFocused, recordLabel } from "@/lib/scope";
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
        : null);
    setDay(d);
    setEntries(es);
    // The bowel red flag counts days, so it needs the last one before today.
    const bmQ = multi ? { type: "bm", patient_id: patientId } : { type: "bm", surgery_id: focused.id };
    const bm = asRows(await base44.entities.RecoveryEntry.filter(bmQ, "-date", 5));
    setLastBm(bm.find((e) => e.date < date)?.date || null);
  }, [date, patientId, focused, multi, canWrite, scopeRecords.length]);

  useEffect(() => {
    setDay(null);
    setEntries(null);
    load();
  }, [load]);

  // Nothing to log against: no record at all (a care team member on a patient
  // with none yet). Maintenance makes this rare, but it is still reachable.
  if (!scopeRecords.length || !focused) {
    return (
      <div className="nb-card p-4">
        <p className="text-sm font-semibold break-words">
          No record to log against yet. Add a surgery on the Care page.
        </p>
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

  const saveEntry = async (payload) => {
    const editing = dialog.entry;
    setDialog(null);
    if (editing) {
      setEntries((rows) => rows.map((e) => (e.id === editing.id ? { ...e, ...payload } : e)));
      await base44.entities.RecoveryEntry.update(editing.id, payload);
    } else {
      const optimistic = {
        id: `pending-${Date.now()}`,
        date,
        type: dialog.type,
        patient_id: patientId,
        surgery_id: focused.id,
        mode: focused.mode,
        created_date: new Date().toISOString(),
        ...payload
      };
      setEntries((rows) => [...rows, optimistic]);
      await base44.entities.RecoveryEntry.create({
        date,
        type: dialog.type,
        patient_id: patientId,
        surgery_id: focused.id,
        mode: focused.mode,
        ...payload
      });
    }
    load();
  };

  const deleteEntry = async () => {
    const gone = dialog.entry.id;
    setDialog(null);
    setEntries((rows) => rows.filter((e) => e.id !== gone));
    await base44.entities.RecoveryEntry.delete(gone);
    load();
  };

  const saveOrder = async (order) => {
    await base44.entities.Surgery.update(focused.id, { tracked_types: order });
    await refreshSurgeries();
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
          className="w-full flex items-center gap-1.5 mb-2"
        >
          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${addOpen ? "rotate-90" : ""}`} />
          <h2 className="font-heading text-sm uppercase tracking-wider">Log an entry</h2>
        </button>
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

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
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