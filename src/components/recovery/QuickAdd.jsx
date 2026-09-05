import React from "react";
import { TYPES, QUICK_ORDER } from "@/lib/recovery";

export default function QuickAdd({ types, onAdd }) {
  const list = types?.length ? types : QUICK_ORDER;
  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card break-words">
        Nothing is selected to track. Pick what to track in Profile.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {list.map((t) => {
        const c = TYPES[t];
        if (!c) return null;
        const Icon = c.icon;
        return (
          <button
            key={t}
            onClick={() => onAdd(t)}
            className="nb-btn min-h-16 py-1.5 flex-col gap-0.5 text-[9px] leading-tight !rounded-xl"
            style={{ backgroundColor: c.color, color: c.darkText ? "#1A1024" : "#fff" }}
          >
            <Icon className="w-5 h-5" />
            <span className="px-0.5">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}