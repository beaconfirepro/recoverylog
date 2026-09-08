import React, { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { sortEntries, runningTotals, computeTotals } from "@/lib/daySummary";
import { suggestFlags } from "@/lib/redFlags";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient, trackedTypes } from "@/lib/PatientContext";
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
          No surgery is being tracked yet. Add one on the Surgery page.
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

  const saveEntry = async (payload) => {
    setSaving(true);
    if (dialog.entry) await base44.entities.RecoveryEntry.update(dialog.entry.id, payload);
    else
      await base44.entities.RecoveryEntry.create({
        date,
        type: dialog.type,
        patient_id: patientId,
        surgery_id: activeSurgeryId,
        ...payload
      });
    setSaving(false);
    setDialog(null);
    load();
  };

  const deleteEntry = async () => {
    await base44.entities.RecoveryEntry.delete(dialog.entry.id);
    setDialog(null);
    load();
  };

  // The arranged order is the surgery's, so every screen reading it agrees.
  const saveOrder = async (order) => {
    await base44.entities.Surgery.update(activeSurgeryId, { tracked_types: order });
    await refreshSurgeries();
  };

  return (
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
              ? "This surgery is not tracking days before the surgery date. Turn that on in Profile to log here."
              : "This surgery is not tracking days from the surgery date onwards. Turn that on in Profile to log here."}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-sm uppercase tracking-wider">The page</h2>
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
            Nothing logged yet — tap a button above and it will land here in order.
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
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
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
  );
}