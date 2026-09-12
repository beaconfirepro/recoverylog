import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// The orientation checklist passes an `orient` key in navigation state when a
// step sends the patient to another page. This finds the matching [data-orient]
// heading, scrolls it into view, then for about five seconds pulses a green ring
// around it and lays a light gray screen over everything else so it stands out.
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
    let backdrop = null;

    const clearState = () => navigate(location.pathname, { replace: true, state: null });
    const removeBackdrop = () => {
      if (backdrop) {
        backdrop.remove();
        backdrop = null;
      }
    };

    const start = () => {
      if (!el) return;
      // A transparent div sized to the heading (plus a little room for the
      // ring) whose huge box-shadow washes the rest of the viewport gray,
      // leaving only the heading un-dimmed.
      const rect = el.getBoundingClientRect();
      const pad = 8;
      backdrop = document.createElement("div");
      backdrop.className = "orient-backdrop";
      backdrop.style.cssText =
        `position:fixed;z-index:40;left:${rect.left - pad}px;top:${rect.top - pad}px;` +
        `width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;pointer-events:none;`;
      document.body.appendChild(backdrop);
      el.classList.add("orient-pulse");
      pulseTimer = setTimeout(() => {
        el?.classList.remove("orient-pulse");
        removeBackdrop();
        clearState();
      }, 5000);
    };

    const run = () => {
      el = document.querySelector(`[data-orient="${CSS.escape(key)}"]`);
      if (el) {
        fired.current = key;
        const rect = el.getBoundingClientRect();
        // Land the title just below the sticky app bar rather than sliding it
        // under, since the anchor is now the heading, not the whole card.
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - 52), behavior: "smooth" });
        // Let the smooth scroll settle before pinning the backdrop so it lines
        // up with where the heading ends up.
        startTimer = setTimeout(start, 500);
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
      if (el) el.classList.remove("orient-pulse");
      removeBackdrop();
    };
  }, [key, navigate, location.pathname]);
}