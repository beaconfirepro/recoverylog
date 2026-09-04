import React from 'react';
import { computeTotals } from '@/lib/recoveryUtils';
import { cn } from '@/lib/utils';

// Auto-calculated bottom-of-day summary.
export default function DayTotals({ entries, day }) {
  const t = computeTotals(entries, day);
  const waterPct = Math.min(100, Math.round((t.water_total / 100) * 100));
  const proteinPct = Math.min(100, Math.round((t.protein_total / 100) * 100));

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold">Day Totals</h3>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Water" value={`${t.water_total} / 100 oz`} pct={waterPct} />
        <Stat label="Protein" value={`${t.protein_total} / 100 g`} pct={proteinPct} />
        <Stat label="Garment" value={`${t.garment_hours ?? 0} h`} />
        <Stat label="Walks" value={t.walk_count} />
        <Stat label="Sleep + naps" value={`${t.sleep_total} h`} />
        <Stat label="Temp PM" value={t.temp_pm ?? '—'} />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">Best check-in</div>
          <div className="text-sm font-medium">{t.best_checkin ? `${t.best_checkin.time} · score ${t.best_checkin.score}` : '—'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase text-muted-foreground">Worst check-in</div>
          <div className="text-sm font-medium">{t.worst_checkin ? `${t.worst_checkin.time} · score ${t.worst_checkin.score}` : '—'}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, pct }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      {pct != null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full', label === 'Water' ? 'bg-sky-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}