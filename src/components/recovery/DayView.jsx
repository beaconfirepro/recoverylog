import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { sortEntries, runningTotals, computeTotals } from "@/lib/daySummary";
import { usePatient, trackedTypes } from "@/lib/PatientContext";
import QuickAdd from "./QuickAdd";
import EntryCard from "./EntryCard";
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

export default function DayView({ date }) {
  const { patientId, activeSurgery, activeSurgeryId } = usePatient();
  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState(null);
  const [spots, setSpots] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeSurgeryId) {
      setDay(null);
      setEntries([]);
      return;
    }
    const existing = await base44.entities.RecoveryDay.filter({ date, surgery_id: activeSurgeryId }, "date", 1);
    const d =
      existing[0] ||
      (await base44.entities.RecoveryDay.create({ date, patient_id: patientId, surgery_id: activeSurgeryId }));
    setDay(d);
    setEntries(await base44.entities.RecoveryEntry.filter({ date, surgery_id: activeSurgeryId }, "created_date", 500));
  }, [date, patientId, activeSurgeryId]);

  const loadSpots = useCallback(async () => {
    setSpots(await base44.entities.MeasurementSpot.list("sort_order", 50));
  }, []);

  useEffect(() => {
    setDay(null);
    setEntries(null);
    load();
  }, [load]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

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

  const addSpot = async (name) => {
    await base44.entities.MeasurementSpot.create({ name, sort_order: spots.length, patient_id: patientId });
    loadSpots();
  };

  const removeSpot = async (id) => {
    await base44.entities.MeasurementSpot.delete(id);
    loadSpots();
  };

  return (
    <div className="space-y-4">
      <DayHeader day={day} />

      <div>
        <h2 className="font-heading text-sm uppercase tracking-wider mb-2">Log an entry</h2>
        {loggable ? (
          <QuickAdd types={trackedTypes(activeSurgery)} onAdd={(type) => setDialog({ type })} />
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
        {sorted.map((e) => (
          <EntryCard key={e.id} entry={e} run={run[e.id]} onEdit={() => setDialog({ entry: e })} />
        ))}
      </div>

      <DayTotals totals={totals} />

      <RedFlagCheck
        key={day.id + JSON.stringify(day.red_flag_answers || {}) + JSON.stringify(day.red_flag_details || {})}
        day={day}
        onSaved={load}
      />

      <QuestionsCard key={day.id + JSON.stringify(day.questions || [])} day={day} onSaved={load} />

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {dialog && (
            <EntryForm
              type={dialog.entry ? dialog.entry.type : dialog.type}
              entry={dialog.entry}
              spots={spots}
              onAddSpot={addSpot}
              onRemoveSpot={removeSpot}
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