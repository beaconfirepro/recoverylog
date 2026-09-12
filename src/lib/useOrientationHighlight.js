import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// The orientation checklist passes an `orient` key in navigation state when a
// step sends the patient to another page. This finds the matching
// [data-orient] element, scrolls it into view, and pulses it for about five
// seconds so the step's target is obvious. It polls briefly because some
// targets (the day page) only mount their section after a data load, and clears
// the navigation state when it is done so a back/forward does not replay it.
export function useOrientationHighlight() {
  const location = useLocation();
  const navigate = useNavigate();
  const key = location.state?.orient;
  const fired = useRef(null);

  useEffect(() => {
    if (!key || fired.current === key) return;
    let el = null;
    let pollTimer = null;
    let pulseTimer = null;

    const clearState = () => navigate(location.pathname, { replace: true, state: null });

    const run = () => {
      el = document.querySelector(`[data-orient="${CSS.escape(key)}"]`);
      if (el) {
        fired.current = key;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("orient-pulse");
        pulseTimer = setTimeout(() => {
          el?.classList.remove("orient-pulse");
          clearState();
        }, 5000);
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
      if (pulseTimer) clearTimeout(pulseTimer);
      if (el) el.classList.remove("orient-pulse");
    };
  }, [key, navigate, location.pathname]);
}