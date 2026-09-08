import React, { useCallback, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const TRIGGER = 72;
const MAX = 110;

// Drag down from the top of a list to reload it. Only starts when the page is
// already scrolled to the top and the finger is moving down, so it never steals
// a scroll or a horizontal swipe from the page underneath.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(null);

  const end = useCallback(async () => {
    if (start.current === null) return;
    const reached = pull >= TRIGGER;
    start.current = null;
    setPull(0);
    if (!reached || busy) return;
    setBusy(true);
    try {
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }, [pull, busy, onRefresh]);

  return (
    <div
      onTouchStart={(e) => {
        start.current = window.scrollY <= 0 && !busy ? e.touches[0].clientY : null;
      }}
      onTouchMove={(e) => {
        if (start.current === null) return;
        const dy = e.touches[0].clientY - start.current;
        if (dy <= 0) {
          // Moving up again is a scroll, not a pull. Hand it back.
          start.current = null;
          setPull(0);
          return;
        }
        // Resisted rather than one-to-one, so the sheet feels attached.
        setPull(Math.min(MAX, dy * 0.5));
      }}
      onTouchEnd={end}
      onTouchCancel={end}
    >
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: busy ? 44 : pull, transition: start.current === null ? "height .2s ease" : "none" }}
        aria-hidden={!busy}
      >
        <RefreshCw
          className={`w-5 h-5 ${busy ? "animate-spin" : ""}`}
          style={{ transform: busy ? undefined : `rotate(${(pull / TRIGGER) * 270}deg)`, opacity: busy ? 1 : pull / TRIGGER }}
        />
        <span className="sr-only" role="status">
          {busy ? "Refreshing" : ""}
        </span>
      </div>
      {children}
    </div>
  );
}
