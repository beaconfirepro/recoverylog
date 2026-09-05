import React from "react";

// Labeled field wrapper shared by every form in the app. Drop it in a
// `grid grid-cols-2 gap-3` and pass `span` for a full-width row.
export default function Field({ label, hint, span, children }) {
  return (
    <div className={`min-w-0 space-y-1.5 ${span ? "col-span-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="nb-label truncate">{label}</label>
        {hint && <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
