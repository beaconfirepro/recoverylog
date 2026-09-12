import React from "react";
import { ListChecks } from "lucide-react";

// The minimized form of the orientation: a floating button that re-expands it.
export default function OrientationFab({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label || "Open orientation"}
      className="nb-btn fixed right-4 bottom-24 z-40 h-12 px-3 bg-primary text-primary-foreground gap-2"
    >
      <ListChecks className="w-5 h-5 shrink-0" />
      <span className="text-xs">{label || "Get started"}</span>
    </button>
  );
}