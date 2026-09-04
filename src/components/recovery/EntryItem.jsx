import React from 'react';
import { ENTRY_TYPE_MAP } from '@/lib/recoveryConfig';
import { fmtTime, markerFor, entrySummary } from '@/lib/recoveryUtils';
import { cn } from '@/lib/utils';

// One row: time (left) · entry (middle) · marker (right). Reads like the paper page.
export default function EntryItem({ entry, entries, idx, onEdit, onDelete }) {
  const type = ENTRY_TYPE_MAP[entry.type];
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="w-16 shrink-0 pt-0.5">
        <div className="text-sm font-semibold tabular-nums">{fmtTime(entry.timestamp)}</div>
        <div className={cn('text-[10px] font-bold mt-0.5 inline-block px-1.5 py-0.5 rounded', type?.color)}>
          {type?.abbr}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug break-words">{entrySummary(entry)}</p>
        <div className="flex gap-3 mt-1.5">
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
          <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <span className="text-[11px] font-mono text-muted-foreground break-words">
          {markerFor(entry, entries, idx)}
        </span>
      </div>
    </div>
  );
}