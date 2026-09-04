import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { todayStr, fmtDateLong, computeTotals, nowISO } from '@/lib/recoveryUtils';
import AppLayout from '@/components/recovery/AppLayout';
import DayHeader from '@/components/recovery/DayHeader';
import EntryItem from '@/components/recovery/EntryItem';
import EntryForm, { EntryTypePicker } from '@/components/recovery/EntryForm';
import DayTotals from '@/components/recovery/DayTotals';
import RedFlagCheck from '@/components/recovery/RedFlagCheck';
import QuestionsList from '@/components/recovery/QuestionsList';
import { Button } from '@/components/ui/button';
import { Plus, Download, Loader2 } from 'lucide-react';
import { exportDayToPdf } from '@/lib/pdfExport';

export default function DayView() {
  const { date } = useParams();
  const dayDate = date || todayStr();
  const isToday = dayDate === todayStr();

  const [day, setDay] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formState, setFormState] = useState(null); // {type, entry}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let days = await base44.entities.RecoveryDay.filter({ date: dayDate });
      let d = days[0];
      if (!d && isToday) {
        // Create today's day, copying measurement spots from the most recent day.
        const recent = await base44.entities.RecoveryDay.list('-date', 1);
        const prev = recent[0];
        const dayNumber = prev ? (prev.day_number || 0) + 1 : 1;
        d = await base44.entities.RecoveryDay.create({
          day_number: dayNumber,
          date: dayDate,
          measurement_spots: prev?.measurement_spots || [],
          measurements: {},
          questions: [],
          red_flags: {},
        });
      }
      setDay(d || null);
      const ents = d ? await base44.entities.RecoveryEntry.filter({ day_id: d.id }) : [];
      ents.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
      setEntries(ents);
    } finally {
      setLoading(false);
    }
  }, [dayDate, isToday]);

  useEffect(() => { load(); }, [load]);

  const persistDay = async (next) => {
    setDay(next);
    await base44.entities.RecoveryDay.update(next.id, next);
  };

  const persistTotals = async (d, ents) => {
    const t = computeTotals(ents, d);
    const next = {
      ...d,
      water_total: t.water_total,
      protein_total: t.protein_total,
      garment_hours: t.garment_hours,
      walk_count: t.walk_count,
      sleep_total: t.sleep_total,
    };
    setDay(next);
    await base44.entities.RecoveryDay.update(d.id, next);
  };

  const handleSaveEntry = async (payload) => {
    const entryRecord = {
      day_id: day.id,
      day_date: dayDate,
      timestamp: payload.timestamp,
      type: payload.type,
      data: payload.data,
      note: payload.note,
    };
    let saved;
    if (formState?.entry?.id) {
      saved = await base44.entities.RecoveryEntry.update(formState.entry.id, entryRecord);
    } else {
      saved = await base44.entities.RecoveryEntry.create(entryRecord);
    }
    const next = formState?.entry?.id
      ? entries.map((e) => (e.id === saved.id ? saved : e))
      : [...entries, saved];
    next.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    setEntries(next);

    // Side effects on the day header.
    let dayPatch = { ...day };
    const d = payload.data || {};
    if (payload.type === 'bm') dayPatch.last_bm_date = dayDate;
    if (payload.type === 'med' && d.next_allowed) dayPatch.next_med_due = d.next_allowed;
    if (payload.type === 'photos') dayPatch.photos_taken = true;
    if (payload.type === 'measurements' && d.measurements) dayPatch.measurements = { ...dayPatch.measurements, ...d.measurements };
    if (payload.type === 'weight' && d.weight != null) dayPatch.weight = d.weight;
    await persistDay(dayPatch);
    await persistTotals(dayPatch, next);

    setFormState(null);
  };

  const handleDelete = async (entry) => {
    await base44.entities.RecoveryEntry.delete(entry.id);
    const next = entries.filter((e) => e.id !== entry.id);
    setEntries(next);
    await persistTotals(day, next);
  };

  const addSpot = () => persistDay({ ...day, measurement_spots: [...(day.measurement_spots || []), ''], measurements: day.measurements || {} });
  const removeSpot = (i) => {
    const spots = [...(day.measurement_spots || [])];
    spots.splice(i, 1);
    persistDay({ ...day, measurement_spots: spots });
  };

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  if (!day) {
    return (
      <AppLayout>
        <div className="py-16 text-center space-y-3">
          <p className="text-muted-foreground">No log for {fmtDateLong(dayDate)}.</p>
          <Button onClick={async () => {
            const recent = await base44.entities.RecoveryDay.list('-date', 1);
            const prev = recent[0];
            const d = await base44.entities.RecoveryDay.create({
              day_number: prev ? (prev.day_number || 0) + 1 : 1,
              date: dayDate,
              measurement_spots: prev?.measurement_spots || [],
              measurements: {},
              questions: [],
              red_flags: {},
            });
            setDay(d);
          }}>Create this day</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Day {day.day_number}</h1>
            <p className="text-sm text-muted-foreground">{fmtDateLong(dayDate)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportDayToPdf(day, entries)} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </Button>
        </div>

        <DayHeader day={day} onChange={persistDay} onAddSpot={addSpot} onRemoveSpot={removeSpot} />

        {/* Entries — time · entry · marker */}
        <div className="rounded-xl border border-border bg-card px-4">
          <h2 className="text-sm font-semibold text-muted-foreground pt-3 pb-1">Entries</h2>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No entries yet. Tap + to add one.</p>
          ) : (
            entries.map((e, idx) => (
              <EntryItem
                key={e.id}
                entry={e}
                entries={entries}
                idx={idx}
                onEdit={() => setFormState({ type: e.type, entry: e })}
                onDelete={() => handleDelete(e)}
              />
            ))
          )}
        </div>

        <DayTotals entries={entries} day={day} />
        <RedFlagCheck day={day} onChange={persistDay} />
        <QuestionsList day={day} onChange={persistDay} />
      </div>

      {/* FAB */}
      <button
        onClick={() => setPickerOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95"
        aria-label="Add entry"
      >
        <Plus className="w-7 h-7" />
      </button>

      {pickerOpen && (
        <EntryTypePicker
          onClose={() => setPickerOpen(false)}
          onPick={(t) => { setPickerOpen(false); setFormState({ type: t, entry: null }); }}
        />
      )}
      {formState && (
        <EntryForm
          type={formState.type}
          entry={formState.entry}
          day={day}
          onClose={() => setFormState(null)}
          onSave={handleSaveEntry}
        />
      )}
    </AppLayout>
  );
}