import React from "react";
import { TYPES, QUICK_ORDER } from "@/lib/recovery";

export default function QuickAdd({ onAdd }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_ORDER.map((t) => {
        const c = TYPES[t];
        const Icon = c.icon;
        return (
          <button
            key={t}
            onClick={() => onAdd(t)}
            className="nb-btn h-16 flex-col gap-0.5 text-[9px] leading-tight !rounded-xl"
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