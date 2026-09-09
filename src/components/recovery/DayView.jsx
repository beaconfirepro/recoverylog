import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { sortEntries, runningTotals, computeTotals } from "@/lib/daySummary";
import { suggestFlags } from "@/lib/redFlags";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient, trackedTypes } from "@/lib/PatientContext";
import PullToRefresh from "@/components/PullToRefresh";
import QuickAdd from "./QuickAdd";
import DayFeed from "./DayFeed";
import EntryForm from "./EntryForm";
import DayHeader from "./DayHeader";
import DayTotals from "./DayTotals";
import RedFlagCheck from "./RedFlagCheck";
import QuestionsCard from "./QuestionsCard";

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function DayView({ date, startCollapsed }) {
  const { patientId, activeSurgery, activeSurgeryId, canWrite, refreshSurgeries } = usePatient();
  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(!startCollapsed);
  const [lastBm, setLastBm] = useState(null);

  const load = useCallback(async () => {
    if (!activeSurgeryId) {
      setDay(null);
      setEntries([]);
      return;
    }
    const existing = asRows(await base44.entities.RecoveryDay.filter({ date, surgery_id: activeSurgeryId }, "date", 1));
    const d =
      existing[0] ||
      (await base44.entities.RecoveryDay.create({ date, patient_id: patientId, surgery_id: activeSurgeryId }));
    setDay(d);
    setEntries(asRows(await base44.entities.RecoveryEntry.filter({ date, surgery_id: activeSurgeryId }, "created_date", 500)));
    // The bowel red flag counts days, so it needs the last one before today.
    const bm = asRows(await base44.entities.RecoveryEntry.filter({ type: "bm", surgery_id: activeSurgeryId }, "-date", 1));
    setLastBm(bm.find((e) => e.date < date)?.date || null);
  }, [date, patientId, activeSurgeryId]);

  useEffect(() => {
    setDay(null);
    setEntries(null);
    load();
  }, [load]);

  if (!activeSurgeryId) {
    return (
      <div className="nb-card p-4">
        <p className="text-sm font-semibold break-words">
          No surgery is being tracked yet. Add one on the Care page.
        </p>
      </div>
    );
  }
  if (!day || entries === null) return <Spinner />;

  const sd = activeSurgery?.surgery_date || null;
  const beforeSurgery = !!sd && date < sd;
  const loggable = beforeSurgery
    ? activeSurgery?.track_before !== false
    : activeSurgery?.track_after !== false;

  const sorted = sortEntries(entries);
  const run = runningTotals(sorted);
  const totals = computeTotals(entries, date);
  const suggestions = suggestFlags(entries, activeSurgery, lastBm, date);

  // The dialog closes and the day updates on the spot, then the write goes out.
  // Waiting on a round trip to see your own entry appear is what makes a log
  // feel like a form rather than a notebook.
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
        surgery_id: activeSurgeryId,
        created_date: new Date().toISOString(),
        ...payload
      };
      setEntries((rows) => [...rows, optimistic]);
      await base44.entities.RecoveryEntry.create({
        date,
        type: dialog.type,
        patient_id: patientId,
        surgery_id: activeSurgeryId,
        ...payload
      });
    }
    // Reload either way: it replaces the stand-in with the saved row, and puts
    // the real state back on screen if the write did not land.
    load();
  };

  const deleteEntry = async () => {
    const gone = dialog.entry.id;
    setDialog(null);
    setEntries((rows) => rows.filter((e) => e.id !== gone));
    await base44.entities.RecoveryEntry.delete(gone);
    load();
  };

  // The arranged order is the surgery's, so every screen reading it agrees.
  const saveOrder = async (order) => {
    await base44.entities.Surgery.update(activeSurgeryId, { tracked_types: order });
    await refreshSurgeries();
  };

  return (
    <PullToRefresh onRefresh={load}>
      <div className="space-y-4">
      <DayHeader day={day} />

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
          <QuickAdd
            types={trackedTypes(activeSurgery)}
            onAdd={(type) => setDialog({ type })}
            onReorder={saveOrder}
            canWrite={canWrite}
          />
        ) : (
          <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card break-words">
            {beforeSurgery
              ? "Not tracking days before surgery. Turn that on in Profile."
              : "Not tracking days from surgery onwards. Turn that on in Profile."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-sm uppercase tracking-wider">The page</h2>
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
            Nothing logged yet.
          </p>
        )}
        {sorted.length > 0 && (
          <DayFeed entries={sorted} run={run} surgery={activeSurgery} onEdit={(e) => setDialog({ entry: e })} />
        )}
      </div>

      <DayTotals totals={totals} day={day} surgery={activeSurgery} />

      <RedFlagCheck
        key={day.id + JSON.stringify(day.red_flag_answers || {}) + JSON.stringify(day.red_flag_details || {})}
        day={day}
        suggestions={suggestions}
        onSaved={load}
      />

      <QuestionsCard key={day.id + JSON.stringify(day.questions || [])} day={day} onSaved={load} />

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        {/* Radix focuses the first field when the dialog opens, which throws the
            phone keyboard up over the form before you have read it. Focusing the
            panel instead keeps the trap and leaves the form alone. */}
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