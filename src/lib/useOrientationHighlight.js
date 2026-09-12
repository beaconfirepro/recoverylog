import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// The orientation checklist passes an `orient` key in navigation state when a
// step sends the patient to another page. This finds the matching [data-orient]
// heading, scrolls it into view, then for about five seconds lays a light gray
// screen over everything else and pulses a lime ring around the edge of what is
// left lit, so it stands out.
// It polls briefly because some targets (the day page) only mount after a data
// load, and clears the navigation state when it is done so a back/forward does
// not replay it.
export function useOrientationHighlight() {
  const location = useLocation();
  const navigate = useNavigate();
  const key = location.state?.orient;
  const fired = useRef(null);

  useEffect(() => {
    if (!key || fired.current === key) return;
    let el = null;
    let pollTimer = null;
    let startTimer = null;
    let pulseTimer = null;
    let rafId = null;
    let backdrop = null;
    let settled = false;

    const clearState = () => navigate(location.pathname, { replace: true, state: null });
    const removeBackdrop = () => {
      if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
    };

    const start = () => {
      if (!el || settled) return;
      settled = true;
      if (rafId) cancelAnimationFrame(rafId);
      // A transparent div sized to the heading (plus a little room for the
      // ring) whose huge box-shadow washes the rest of the viewport gray,
      // leaving only the heading un-dimmed. Read after the scroll has settled
      // so it lines up with where the heading actually ends up.
      const rect = el.getBoundingClientRect();
      const pad = 8;
      backdrop = document.createElement("div");
      backdrop.className = "orient-backdrop";
      backdrop.style.cssText =
        `position:fixed;z-index:40;left:${rect.left - pad}px;top:${rect.top - pad}px;` +
        `width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;pointer-events:none;`;
      document.body.appendChild(backdrop);
      el.classList.add("orient-target", "orient-enter");
      pulseTimer = setTimeout(() => {
        el?.classList.remove("orient-target", "orient-enter");
        removeBackdrop();
        clearState();
      }, 5000);
    };

    const run = () => {
      el = document.querySelector(`[data-orient="${CSS.escape(key)}"]`);
      if (el) {
        fired.current = key;
        // The sticky app bar is the header element; its real bottom (which
        // already includes the safe-area inset) is the line the heading should
        // sit below, rather than a guessed constant that left it tucked under.
        const header = document.querySelector("header");
        const offset = (header ? header.getBoundingClientRect().bottom : 0) + 8;
        el.style.scrollMarginTop = `${offset}px`;
        const rect = el.getBoundingClientRect();
        // Only scroll if the heading is not already in the right place, so a
        // re-orient on the same page does not jump.
        if (Math.abs(rect.top - offset) > 4) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // Pin the backdrop once the smooth scroll has settled, so it lines up
        // with where the heading ends up rather than where it was mid-scroll.
        let last = window.scrollY;
        let idle = 0;
        const tick = () => {
          const y = window.scrollY;
          if (y === last) {
            idle += 1;
            if (idle >= 3) { start(); return; }
          } else {
            idle = 0;
            last = y;
          }
          rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        // Hard ceiling so a browser that never reports a still scroll still
        // gets the highlight, just pinned a little early.
        startTimer = setTimeout(start, 800);
        return;
      }
      pollTimer = setTimeout(run, 80);
    };

    // Give up after 2s so we never poll forever if the target never renders.
    const giveUp = setTimeout(() => {
      if (!el) {
        if (pollTimer) clearTimeout(pollTimer);
        clearState();
      }
    }, 2000);

    run();

    return () => {
      clearTimeout(giveUp);
      if (pollTimer) clearTimeout(pollTimer);
      if (startTimer) clearTimeout(startTimer);
      if (pulseTimer) clearTimeout(pulseTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (el) {
        el.classList.remove("orient-target", "orient-enter");
        if (el.style.scrollMarginTop) el.style.scrollMarginTop = "";
      }
      removeBackdrop();
    };
  }, [key, navigate, location.pathname]);
}