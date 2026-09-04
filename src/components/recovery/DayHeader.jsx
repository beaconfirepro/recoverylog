import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { SLEPT_POSITIONS } from '@/lib/recoveryConfig';
import { cn } from '@/lib/utils';

// Collapsible day header editor. Big tap targets.
export default function DayHeader({ day, onChange, onAddSpot, onRemoveSpot }) {
  const [open, setOpen] = useState(false);
  if (!day) return null;
  const u = (patch) => onChange({ ...day, ...patch });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <div className="text-left">
          <div className="text-base font-semibold">Day {day.day_number} · Header</div>
          <div className="text-xs text-muted-foreground">Tap to {open ? 'collapse' : 'edit'} the day header</div>
        </div>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-border">
          <div className="grid grid-cols-2 gap-3 mt-4">
            <NumField label="Woke at" value={day.woke_at} onChange={(v) => u({ woke_at: v })} type="time" />
            <NumField label="Temp AM" value={day.temp_am} onChange={(v) => u({ temp_am: v })} step="0.1" />
            <NumField label="Temp PM" value={day.temp_pm} onChange={(v) => u({ temp_pm: v })} step="0.1" />
            <NumField label="Weight" value={day.weight} onChange={(v) => u({ weight: v })} step="0.1" />
            <NumField label="Slept (hrs)" value={day.slept_hours} onChange={(v) => u({ slept_hours: v })} step="0.1" />
            <Chips label="Slept position" options={SLEPT_POSITIONS} value={day.slept_position} onChange={(v) => u({ slept_position: v })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Last BM date" value={day.last_bm_date} onChange={(v) => u({ last_bm_date: v })} type="date" />
            <label className="flex items-center gap-2.5 pt-6">
              <input
                type="checkbox"
                checked={!!day.photos_taken}
                onChange={(e) => u({ photos_taken: e.target.checked })}
                className="w-5 h-5 accent-primary"
              />
              <span className="text-sm font-medium">Photos taken</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">Next med due</label>
            <input
              type="datetime-local"
              value={day.next_med_due ? toLocalDT(day.next_med_due) : ''}
              onChange={(e) => u({ next_med_due: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="w-full mt-1.5 px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Measurement spots — named once, reused every day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Measurement spots</label>
              <Button size="sm" variant="outline" onClick={onAddSpot} className="h-8"><Plus className="w-4 h-4 mr-1" /> Spot</Button>
            </div>
            {day.measurement_spots?.map((spot, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={spot}
                  onChange={(e) => {
                    const spots = [...day.measurement_spots];
                    spots[i] = e.target.value;
                    u({ measurement_spots: spots });
                  }}
                  placeholder="e.g. Waist"
                  className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-input bg-background"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={day.measurements?.[spot] ?? ''}
                  onChange={(e) => u({ measurements: { ...day.measurements, [spot]: e.target.value } })}
                  placeholder="value"
                  className="w-20 px-3 py-2.5 text-sm rounded-lg border border-input bg-background"
                />
                <button onClick={() => onRemoveSpot(i)} className="p-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
            ))}
            {!day.measurement_spots?.length && (
              <p className="text-xs text-muted-foreground">Add the spots you measure (same ones every day).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange, type = 'number', step }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : (type === 'number' ? Number(e.target.value) : e.target.value))}
        className="w-full px-3 py-2.5 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function Chips({ label, options, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? null : opt)}
            className={cn(
              'px-3 py-2 rounded-full border text-xs capitalize',
              value === opt ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function toLocalDT(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}