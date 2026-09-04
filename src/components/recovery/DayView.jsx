import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { daysBetween } from "@/lib/dates";
import { sortEntries, runningTotals, computeTotals, lastBmInfo } from "@/lib/daySummary";
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
  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState(null);
  const [spots, setSpots] = useState([]);
  const [lastBmEntry, setLastBmEntry] = useState(null);
  const [surgeryDate, setSurgeryDate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const info = await base44.entities.SurgeryInfo.list("created_date", 1);
    const surgeryDate = info[0]?.surgery_date || null;
    const existing = await base44.entities.RecoveryDay.filter({ date }, "date", 1);
    let d = existing[0];
    if (!d) {
      const all = await base44.entities.RecoveryDay.list("date", 500);
      const first = all[0];
      const startDate = surgeryDate || first?.date;
      d = await base44.entities.RecoveryDay.create({
        date,
        day_number: startDate ? daysBetween(startDate, date) : 0
      });
    }
    setSurgeryDate(surgeryDate);
    setDay(d);
    setEntries(await base44.entities.RecoveryEntry.filter({ date }, "created_date", 500));
    const bm = await base44.entities.RecoveryEntry.filter({ type: "bm" }, "-created_date", 1);
    setLastBmEntry(bm[0] || null);
  }, [date]);

  const loadSpots = useCallback(async () => {
    setSpots(await base44.entities.MeasurementSpot.list("sort_order", 50));
  }, []);

  useEffect(() => {
    setDay(null);
    setEntries(null);
    setSurgeryDate(null);
    load();
  }, [load]);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  if (!day || entries === null) return <Spinner />;

  const sorted = sortEntries(entries);
  const run = runningTotals(sorted);
  const totals = computeTotals(entries, date);

  const saveEntry = async (payload) => {
    setSaving(true);
    if (dialog.entry) await base44.entities.RecoveryEntry.update(dialog.entry.id, payload);
    else await base44.entities.RecoveryEntry.create({ date, type: dialog.type, ...payload });
    setSaving(false);
    setDialog(null);
    load();
  };

  const deleteEntry = async () => {
    await base44.entities.RecoveryEntry.delete(dialog.entry.id);
    setDialog(null);
    load();
  };

  return (
    <div className="space-y-4">
      <DayHeader
        day={day}
        surgeryDate={surgeryDate}
        totals={totals}
        lastBm={lastBmInfo(lastBmEntry, date)}
        spots={spots}
        onSaved={load}
        onSpotsChanged={loadSpots}
      />

      <div>
        <h2 className="font-heading text-sm uppercase tracking-wider mb-2">Log an entry</h2>
        <QuickAdd onAdd={(type) => setDialog({ type })} />
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