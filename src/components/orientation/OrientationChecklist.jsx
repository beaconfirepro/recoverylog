import React from "react";
import { Minus } from "lucide-react";
import { ORIENTATION_ITEMS, doneCount, allDone } from "@/lib/orientation";
import OrientationItem from "@/components/orientation/OrientationItem";

// The guided tour's own page: the list of steps, each of which takes you to
// the screen it is about. It replaces the day view while expanded; minimizing
// it leaves a floating button. Ticking "don't show again" dismisses it for good
// (still openable from Setup).
//
// The code underneath still says orientation throughout — the state key, the
// `orient` navigation key, the [data-orient] attributes. Only the words the
// patient reads changed. Renaming the plumbing would touch every tour target
// and the stored per-patient progress key, which would quietly reset the
// progress of anyone part way through.
export default function OrientationChecklist({ state, derived = {}, setState, onMinimize, onDismiss, onNavigate }) {
  const complete = doneCount(state, derived);
  const total = ORIENTATION_ITEMS.length;
  const finished = allDone(state, derived);

  return (
    <div className="space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl uppercase leading-tight break-words">Guided Tour</div>
            <div className="text-sm font-semibold break-words">
              {complete} of {total} done.
            </div>
          </div>
          <button
            type="button"
            aria-label="Minimize the guided tour"
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
              derived={derived}
              setState={setState}
              onNavigate={onNavigate}
            />
          ))}

          {finished && (
            <p className="text-sm font-bold text-center break-words">
              All set. You can reopen the guided tour from Setup any time.
            </p>
          )}

          <label className="flex items-center gap-2 pt-2 border-t-2">
            <input
              type="checkbox"
              checked={!!state.dismissed}
              onChange={(e) => e.target.checked && onDismiss()}
              className="w-5 h-5 accent-foreground shrink-0"
            />
            <span className="text-sm font-semibold break-words">Don't show the guided tour again</span>
          </label>
        </div>
      </div>
    </div>
  );
}