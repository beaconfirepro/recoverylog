import React, { useState } from 'react';
import { RED_FLAG_ITEMS } from '@/lib/recoveryConfig';
import { fmtTime, nowISO } from '@/lib/recoveryUtils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function RedFlagCheck({ day, onChange }) {
  const [open, setOpen] = useState(false);
  const rf = day.red_flags || {};
  const anyYes = Object.keys(rf).some((k) => rf[k]);
  const set = (key, val) => onChange({ ...day, red_flags: { ...rf, [key]: val } });

  return (
    <div className={cn('rounded-xl border overflow-hidden', anyYes ? 'border-red-300 bg-red-50' : 'border-border bg-card')}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2 text-left">
          <AlertTriangle className={cn('w-5 h-5', anyYes ? 'text-red-600' : 'text-muted-foreground')} />
          <div>
            <div className="text-base font-semibold">Red Flag Check</div>
            <div className="text-xs text-muted-foreground">
              {anyYes ? '⚠ Flagged — review below' : 'Evening check · all clear'}
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-2 border-t border-border pt-4">
          {RED_FLAG_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 py-1">
              <span className="text-sm flex-1">{item.label}</span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => set(item.key, false)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', rf[item.key] === false ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border')}
                >No</button>
                <button
                  onClick={() => set(item.key, true)}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', rf[item.key] === true ? 'bg-red-600 text-white border-red-600' : 'border-border')}
                >Yes</button>
              </div>
            </div>
          ))}

          {anyYes && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Office called?</label>
                <button
                  onClick={() => onChange({ ...day, red_flag_office_called: !day.red_flag_office_called })}
                  className={cn('px-3 py-1.5 rounded-full text-xs font-medium border', day.red_flag_office_called ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border')}
                >
                  {day.red_flag_office_called ? 'Yes' : 'No'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Time</label>
                <input
                  type="time"
                  value={day.red_flag_time || ''}
                  onChange={(e) => onChange({ ...day, red_flag_time: e.target.value })}
                  className="px-3 py-2 text-sm rounded-lg border border-input bg-background"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}