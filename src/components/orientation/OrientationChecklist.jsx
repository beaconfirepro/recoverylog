import React from "react";
import { Minus } from "lucide-react";
import { ORIENTATION_ITEMS, doneCount, allDone } from "@/lib/orientation";
import OrientationItem from "@/components/orientation/OrientationItem";

// The full getting-started page. It replaces the day view while expanded;
// minimizing it leaves a floating button. Ticking "don't show again" dismisses
// it for good (still openable from Profile).
export default function OrientationChecklist({ state, setState, onMinimize, onDismiss, onNavigate }) {
  const complete = doneCount(state);
  const total = ORIENTATION_ITEMS.length;
  const finished = allDone(state);

  return (
    <div className="space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl uppercase leading-tight break-words">Welcome, let's get started</div>
            <div className="text-sm font-semibold break-words">
              {complete} of {total} done.
            </div>
          </div>
          <button
            type="button"
            aria-label="Minimize orientation"
            onClick={onMinimize}
            className="nb-btn h-9 w-9 shrink-0 bg-card p-0"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {ORIENTATION_ITEMS.map((it) => (
            <OrientationItem
              key={it.key}
              item={it}
              state={state}
              setState={setState}
              onNavigate={onNavigate}
            />
          ))}

          {finished && (
            <p className="text-sm font-bold text-center break-words">
              All set. You can reopen this from Setup any time.
            </p>
          )}

          <label className="flex items-center gap-2 pt-2 border-t-2">
            <input
              type="checkbox"
              checked={!!state.dismissed}
              onChange={(e) => e.target.checked && onDismiss()}
              className="w-5 h-5 accent-foreground shrink-0"
            />
            <span className="text-sm font-semibold break-words">Don't show this orientation again</span>
          </label>
        </div>
      </div>
    </div>
  );
}