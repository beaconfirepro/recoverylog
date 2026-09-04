import React from 'react';
import { cn } from '@/lib/utils';

// A single config-driven field. Big tap targets, mobile-first.
export default function Field({ field, value, onChange }) {
  if (field.type === 'slider') {
    const v = value ?? 5;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{field.label}</label>
          <span className={cn('text-lg font-bold tabular-nums', field.worst ? 'text-red-600' : 'text-emerald-600')}>
            {v}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={field.max ?? 10}
          step={1}
          value={v}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{field.worst ? '0 = none' : '0 = worst'}</span>
          <span>{field.worst ? `${field.max} = worst` : `${field.max} = best`}</span>
        </div>
      </div>
    );
  }

  if (field.type === 'chips') {
    const sel = value || (field.multiple ? [] : null);
    const toggle = (opt) => {
      if (field.multiple) {
        const arr = Array.isArray(sel) ? [...sel] : [];
        if (arr.includes(opt)) onChange(arr.filter((o) => o !== opt));
        else onChange([...arr, opt]);
      } else {
        onChange(sel === opt ? null : opt);
      }
    };
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const active = field.multiple ? (sel || []).includes(opt) : sel === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  'px-3.5 py-2.5 rounded-full border text-sm capitalize transition active:scale-95',
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-foreground hover:bg-accent'
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{field.label}</label>
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full px-4 py-3 text-lg rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    );
  }

  if (field.type === 'datetime') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{field.label}</label>
        <input
          type="datetime-local"
          value={value ? toLocalDT(value) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="w-full px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    );
  }

  // text
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{field.label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 text-base rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function toLocalDT(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}