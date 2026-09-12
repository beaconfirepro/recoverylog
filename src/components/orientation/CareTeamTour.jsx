import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

// The care-team orientation step is a scripted tour, the same shape as the
// garment tour: spotlight one thing, optionally draw an arrow or a circle,
// say one line, and — for the steps that need it — actually do the action
// (open the form, type a sample invite, press add, press done, expand the row).
// It marks the resend and remove buttons without pressing them, the way the
// garment tour marks remove: a real email send and a real deletion are not the
// point.
//
// It is self-contained on purpose and reuses the shared `gtour-*` classes from
// index.css. It neutralises the plain orientation highlight itself — by pulling
// the data-orient attribute off the heading in a useLayoutEffect, which runs
// before the highlight's useEffect can find it — so it owns the screen.

const NOTES = [
  "Add other people to your care team. This can be a partner, a caregiver, a provider, or even another patient that you want to share your journey with.",
  "Click + to invite the person via email.",
  "They will need to sign up for the app with that email address or already use that one.",
  "To see your info, they need this invite code, your first and last name, and birthdate.",
  "To see if they have accepted the invite, click the title to expand it.",
  "If they need the invitation resent, click here to resend it.",
  "If you want to withdraw their permission or the invite, click remove to prevent them from accessing your account."
];

const EMAIL = "sample@lipnode.com";
const FIRST = "Sample";
const LAST = "Smith";
const PAD = 8;
const SETTLE_MS = 450;
const TYPE_MS = 60;

const STEPS = [
  { target: "careteam-header", mark: "spot", note: NOTES[0], ms: 4400 },
  { target: "careteam-add", mark: "circle", note: NOTES[1], ms: 3000, markAt: 400, click: true, clickAt: 2000 },
  {
    target: "careteam-email",
    mark: "spot",
    note: NOTES[2],
    ms: 8000,
    type: ["careteam-email", "careteam-first", "careteam-last"],
    values: { "careteam-email": EMAIL, "careteam-first": FIRST, "careteam-last": LAST },
    click: true,
    clickTarget: "careteam-submit",
    clickAt: 7200
  },
  {
    target: "careteam-code",
    waitFor: true,
    mark: "spot",
    note: NOTES[3],
    ms: 4400,
    markAt: 600,
    arrowTarget: "careteam-done",
    click: true,
    clickTarget: "careteam-done",
    clickAt: 3600
  },
  { target: "careteam-row", waitFor: true, find: "row", mark: "spot", note: NOTES[4], ms: 3000, click: true, clickAt: 2200 },
  { target: "careteam-resend", waitFor: true, mark: "arrow", note: NOTES[5], ms: 3200, markAt: 400 },
  { target: "careteam-remove", waitFor: true, mark: "circle", note: NOTES[6], ms: 3600, markAt: 400 }
];

const boxOf = (el) => {
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY - PAD,
    left: r.left + window.scrollX - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2
  };
};

// React-controlled inputs ignore a plain .value assignment; setting through the
// prototype's setter and dispatching the input event is what makes the change
// land in the component's state.
const setNativeValue = (el, value) => {
  if (!el) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

const Arrow = ({ box }) => (
  <div className="gtour-arrow" aria-hidden="true" style={{ top: box.top - 48, left: box.left + box.width / 2 - 18 }}>
    <svg viewBox="0 0 36 48" width="36" height="48" fill="none">
      <path className="gtour-arrow-shaft" d="M18 4 V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path className="gtour-arrow-head" d="M7 27 L18 40 L29 27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const Circle = ({ box }) => (
  <svg className="gtour-circle" style={box} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <path
      className="gtour-circle-path"
      d="M50 5 C75 5 95 25 95 50 C95 75 75 95 50 95 C25 95 5 75 5 50 C5 25 25 5 50 5 Z"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
      vectorEffect="non-scaling-stroke"
    />
  </svg>
);

export default function CareTeamTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [box, setBox] = useState(null);
  const [arrowBox, setArrowBox] = useState(null);
  const [markVisible, setMarkVisible] = useState(false);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const finish = useCallback(() => {
    clearTimers();
    // A skipped tour must not leave half-typed sample text in the form.
    setNativeValue(document.querySelector('[data-gtour="careteam-email"]'), "");
    setNativeValue(document.querySelector('[data-gtour="careteam-first"]'), "");
    setNativeValue(document.querySelector('[data-gtour="careteam-last"]'), "");
    setBox(null);
    setArrowBox(null);
    setMarkVisible(false);
    setRunning(false);
  }, []);

  // Latch on the trigger, then drop the navigation state so a back/forward does
  // not replay. The data-orient attribute is pulled before the highlight's
  // useEffect runs (useLayoutEffect runs first), so the plain ring never finds
  // its target and this tour owns the screen.
  useLayoutEffect(() => {
    const want = location.pathname === "/care" && location.state?.orient === "careteam";
    if (!want || running) return;
    setRunning(true);
    setPhase(0);
    setBox(null);
    const heading = document.querySelector('[data-orient="careteam"]');
    if (heading) heading.removeAttribute("data-orient");
    navigate(location.pathname, { replace: true, state: null });
  }, [location, running, navigate]);

  // Stop if the patient leaves Care mid-tour.
  useEffect(() => {
    if (running && location.pathname !== "/care") finish();
  }, [running, location.pathname, finish]);

  useEffect(() => {
    if (!running || phase < 0 || phase >= STEPS.length) return undefined;
    const step = STEPS[phase];
    let cancelled = false;
    clearTimers();
    // Clear the last step's spotlight so a waitFor gap does not leave a stale
    // box floating over a thing that has gone (the dialog closing, the row not
    // yet loaded). The note stays so the hand-off reads as a move, not a flash.
    setBox(null);
    setArrowBox(null);
    setMarkVisible(false);
    const max = step.waitFor ? 10000 : 2000;
    const startedAt = Date.now();

    const findRow = () => {
      const rows = document.querySelectorAll('[data-gtour="careteam-row"]');
      for (const r of rows) {
        if (r.textContent.toLowerCase().includes(EMAIL)) return r;
      }
      return null;
    };

    const startType = () => {
      const ids = step.type || [];
      let i = 0;
      const typeField = (id) => {
        if (cancelled) return;
        const el = document.querySelector(`[data-gtour="${CSS.escape(id)}"]`);
        if (!el) return;
        const val = step.values[id] || "";
        let k = 0;
        const tick = () => {
          if (cancelled) return;
          if (k <= val.length) {
            setNativeValue(el, val.slice(0, k));
            k += 1;
            timers.current.push(setTimeout(tick, TYPE_MS));
          } else {
            i += 1;
            if (i < ids.length) timers.current.push(setTimeout(() => typeField(ids[i]), 200));
          }
        };
        tick();
      };
      if (ids.length) typeField(ids[0]);
    };

    const begin = (el) => {
      if (cancelled) return;
      setBox(boxOf(el));
      setArrowBox(null);
      setMarkVisible(false);
      if (step.markAt != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(true); }, step.markAt));
      } else {
        setMarkVisible(true);
      }
      if (step.markGone != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(false); }, step.markGone));
      }
      if (step.type && step.type.length) startType();
      if (step.arrowTarget) {
        const a = document.querySelector(`[data-gtour="${CSS.escape(step.arrowTarget)}"]`);
        if (a) timers.current.push(setTimeout(() => { if (!cancelled) setArrowBox(boxOf(a)); }, 200));
      }
      if (step.click) {
        const clickId = step.clickTarget || step.target;
        timers.current.push(setTimeout(() => {
          if (cancelled) return;
          const t = step.find === "row" ? findRow() : document.querySelector(`[data-gtour="${CSS.escape(clickId)}"]`);
          if (t) t.click();
        }, step.clickAt));
      }
      timers.current.push(setTimeout(() => {
        if (cancelled) return;
        if (phase === STEPS.length - 1) { finish(); return; }
        setPhase((p) => p + 1);
      }, step.ms));
    };

    const place = (el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      timers.current.push(setTimeout(() => begin(el), SETTLE_MS));
    };

    const findTarget = () => {
      if (step.find === "row") return findRow();
      return document.querySelector(`[data-gtour="${CSS.escape(step.target)}"]`);
    };

    const poll = () => {
      if (cancelled) return;
      const el = findTarget();
      if (el) { place(el); return; }
      if (Date.now() - startedAt > max) { finish(); return; }
      timers.current.push(setTimeout(poll, 120));
    };

    poll();

    return () => { cancelled = true; clearTimers(); };
  }, [running, phase, finish]);

  if (!running || phase < 0 || phase >= STEPS.length) return null;
  const step = STEPS[phase];
  const isLast = phase === STEPS.length - 1;

  return createPortal(
    <>
      {box && <div className="gtour-spot" style={box} aria-hidden="true" />}
      {box && markVisible && step.mark === "arrow" && <Arrow box={box} />}
      {box && markVisible && step.mark === "circle" && <Circle box={box} />}
      {markVisible && arrowBox && step.arrowTarget && <Arrow box={arrowBox} />}
      <div className="gtour-note-wrap" role="status" aria-live="polite">
        <div className="nb-card gtour-note">
          <span key={phase} className="gtour-note-text">{step.note}</span>
          <button type="button" onClick={finish} className="nb-btn h-9 px-3 shrink-0 bg-card text-xs">
            {isLast ? "Done" : "Skip"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}