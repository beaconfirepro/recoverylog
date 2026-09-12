import React, { useEffect, useRef, useState } from "react";

// A short line pinned to the top of the screen that changes as something else
// moves underneath it.
//
// Built for the guided tours, where the thing being pointed at scrolls and the
// words about it must not. It is deliberately not tour-specific: anything that
// narrates a sequence — a walkthrough, a multi-step form, a long import — wants
// exactly this and should use it rather than growing its own.
//
// One line at a time, on purpose. It sits over the app while a tour runs, and a
// banner that can grow to four lines will sooner or later cover the thing it is
// describing.
//
// Changing `text` cross-fades: the old line leaves, the new one arrives. React
// would otherwise reuse the node and swap the characters, which reads as a
// glitch rather than a step.
// Written out rather than built as `notebar-${tone}`: Tailwind reads source
// text, so an interpolated class name is invisible to it and the rule is
// dropped from the bundle. That is how the bar shipped with no yellow.
const TONES = {
  note: "notebar-note"
};

export default function NoteBar({ text, show = true, tone = "note", children }) {
  // Held so the outgoing line has something to render while it fades.
  const [shown, setShown] = useState(text);
  const [leaving, setLeaving] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (text === shown) return;
    setLeaving(shown);
    setShown(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLeaving(null), 200);
    return () => clearTimeout(timer.current);
  }, [text, shown]);

  if (!show || !text) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] px-3 pointer-events-none"
      style={{ paddingTop: "calc(var(--safe-t) + 0.5rem)" }}
    >
      <div
        className={`nb-card notebar ${TONES[tone] || TONES.note} mx-auto max-w-lg px-4 py-3 flex items-center gap-3`}
        role="status"
        aria-live="polite"
      >
        {/* Both lines share one cell so the bar does not resize as they swap,
            and the outgoing one is hidden from the screen reader: aria-live has
            already spoken it once. */}
        <span className="relative flex-1 min-w-0 grid">
          {leaving && (
            <span key={`out-${leaving}`} className="notebar-out col-start-1 row-start-1 text-sm font-bold break-words" aria-hidden="true">
              {leaving}
            </span>
          )}
          <span key={shown} className="notebar-in col-start-1 row-start-1 text-sm font-bold break-words">
            {shown}
          </span>
        </span>
        {children}
      </div>
    </div>
  );
}
