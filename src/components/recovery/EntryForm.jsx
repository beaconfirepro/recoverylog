import React, { useState, useEffect } from 'react';
import { ENTRY_TYPES, ENTRY_TYPE_MAP } from '@/lib/recoveryConfig';
import { nowISO } from '@/lib/recoveryUtils';
import Field from './Field';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EntryForm({ type, entry, day, onSave, onClose }) {
  const typeDef = ENTRY_TYPE_MAP[type];
  const [data, setData] = useState(entry?.data || {});
  const [note, setNote] = useState(entry?.note || '');
  const [timestamp, setTimestamp] = useState(entry?.timestamp || nowISO());
  const [measurements, setMeasurements] = useState(entry?.data?.measurements || day?.measurements || {});

  const setField = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleSave = () => {
    const payload = {
      type,
      timestamp,
      note,
      data: type === 'measurements' ? { measurements } : data,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto max-h-[92vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{entry ? 'Edit' : 'New'} {typeDef?.label}</h2>
          <button onClick={onClose} className="p-2 -mr-2"><X className="w-5 h-5" /></button>
        </div>

        {/* Time */}
        <div className="space-y-1.5 mb-5">
          <label className="text-sm font-medium">Time</label>
          <input
            type="datetime-local"
            value={toLocalDT(timestamp)}
            onChange={(e) => setTimestamp(e.target.value ? new Date(e.target.value).toISOString() : nowISO())}
            className="w-full px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Special: measurements */}
        {type === 'measurements' ? (
          <div className="space-y-3">
            {day?.measurement_spots?.length ? (
              day.measurement_spots.map((spot) => (
                <div key={spot} className="space-y-1.5">
                  <label className="text-sm font-medium">{spot}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={measurements[spot] ?? ''}
                    onChange={(e) => setMeasurements((m) => ({ ...m, [spot]: e.target.value }))}
                    className="w-full px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Name your measurement spots in the day header first.</p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {typeDef?.fields.map((f) => (
              <Field key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />
            ))}
          </div>
        )}

        {/* Free-text note */}
        <div className="space-y-1.5 mt-5">
          <label className="text-sm font-medium">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <Button onClick={handleSave} className="w-full mt-6 h-12 text-base">
          Save {typeDef?.label}
        </Button>
      </div>
    </div>
  );
}

function toLocalDT(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Type picker sheet
export function EntryTypePicker({ onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto rounded-t-2xl bg-background p-5 pb-8 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New entry</h2>
          <button onClick={onClose} className="p-2 -mr-2"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => onPick(t.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl border py-4 px-2 text-center transition active:scale-95',
                t.color
              )}
            >
              <span className="text-xs font-bold">{t.abbr}</span>
              <span className="text-[11px] leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}