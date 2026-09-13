import React from "react";
import { ORIENTATION_ITEMS, doneCount, allDone } from "@/lib/orientation";
import OrientationItem from "@/components/orientation/OrientationItem";

// The getting-started checklist body. Rendered inside the tour drawer from the
// floating button, so the drawer supplies the header and the close gesture —
// this is the steps, the finished line, and the "don't show again" toggle.
export default function OrientationChecklist({ state, derived = {}, setState, onDismiss, onNavigate }) {
  const complete = doneCount(state, derived);
  const total = ORIENTATION_ITEMS.length;
  const finished = allDone(state, derived);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold break-words">
        {complete} of {total} done.
      </p>
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
  );
}