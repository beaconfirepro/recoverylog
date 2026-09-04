import React from "react";
import { TYPES } from "@/lib/recovery";
import { Image } from "@/components/ui/image";

export default function EntryCard({ entry, run, onEdit }) {
  const cfg = TYPES[entry.type];
  const d = entry.data || {};
  const summary = cfg.summary(d, entry, run) || cfg.label;
  const marker = cfg.marker(d, entry, run);

  return (
    <button
      onClick={onEdit}
      className="w-full text-left flex items-stretch gap-2 border-2 rounded-xl bg-card p-2.5 transition-transform active:translate-x-[2px]"
    >
      <div className="w-11 shrink-0 pt-0.5">
        <div className="font-heading text-xs">{entry.entry_time}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading text-[10px] uppercase tracking-wider text-muted-foreground">{cfg.label}</div>
        <div className="text-sm font-medium break-words">{summary}</div>
        {entry.note && <div className="text-xs italic text-muted-foreground break-words">{entry.note}</div>}
        {d.photo_url && (
          <Image src={d.photo_url} alt="entry photo" className="h-20 w-20 mt-1 border-2 rounded-lg object-cover" />
        )}
      </div>
      <div className="shrink-0 self-center">
        <span
          className="inline-block border-2 rounded-full px-2 py-1 text-[10px] font-heading whitespace-nowrap"
          style={{
            backgroundColor: cfg.color,
            color: cfg.darkText ? "#1A1024" : "#fff",
            borderColor: "hsl(var(--foreground))"
          }}
        >
          {marker}
        </span>
      </div>
    </button>
  );
}