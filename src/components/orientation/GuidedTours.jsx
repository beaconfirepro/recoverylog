import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { TOURS } from "@/lib/gtours";

// The shared guided-tour engine. One component, mounted in Layout, runs
// whichever tour the orientation checklist asked for (location.state.orient).
// It is self-contained on purpose and reuses the shared `gtour-*` classes.
//
// The spotlight and marks are `position: fixed` and are re-measured with
// getBoundingClientRect on every animation frame while a step is showing. That
// is correct no matter which element scrolls — the app runs inside an iframe in
// the preview, where window.scrollY stays 0 — and it makes the marks follow a
// smooth scroll live instead of jumping to where it landed.

const PAD = 8;
const SETTLE_MS = 450;
const TYPE_MS = 65;

const boxOf = (el) => {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
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

// A plain div with a pink border and border-radius: 50%. The old SVG circle
// used preserveAspectRatio="none", which stretched the 100×100 viewBox to fill
// a wide row and turned the ring into a flat, broken-looking ellipse. A div
// always renders a complete, closed ring no matter the box shape.
const Circle = ({ box }) => (
  <div className="gtour-circle" style={box} aria-hidden="true" />
);

export default function GuidedTours() {
  const location = useLocation();
  const navigate = useNavigate();
  const key = location.state?.orient;
  const config = key ? TOURS[key] : null;

  const [running, setRunning] = useState(false);
  const [activeConfig, setActiveConfig] = useState(null);
  const [phase, setPhase] = useState(0);
  const [box, setBox] = useState(null);
  const [arrowBox, setArrowBox] = useState(null);
  const [markVisible, setMarkVisible] = useState(false);
  const timers = useRef([]);
  const rafRef = useRef(null);
  const cleanupRef = useRef(null);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const stopRaf = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const finish = useCallback(() => {
    clearTimers();
    stopRaf();
    setBox(null);
    setArrowBox(null);
    setMarkVisible(false);
    setRunning(false);
    setActiveConfig(null);
    const cleanup = cleanupRef.current;
    cleanupRef.current = null;
    if (cleanup) { try { cleanup(); } catch { /* a tour's cleanup is best-effort */ } }
  }, []);

  // Latch on the trigger, then drop the navigation state so a back/forward does
  // not replay. The data-orient attribute is pulled before the page's highlight
  // useEffect runs (this useLayoutEffect runs first), so the plain ring never
  // finds its target and this tour owns the screen.
  useLayoutEffect(() => {
    if (!config || running) return;
    if (location.pathname !== config.path) return;
    cleanupRef.current = config.cleanup || null;
    setActiveConfig(config);
    setRunning(true);
    setPhase(0);
    setBox(null);
    setArrowBox(null);
    setMarkVisible(false);
    const heading = document.querySelector(`[data-orient="${CSS.escape(key)}"]`);
    if (heading) heading.removeAttribute("data-orient");
    if (config.onStart) config.onStart();
    navigate(location.pathname, { replace: true, state: null });
  }, [location, running, navigate, config, key]);

  // Stop if the patient leaves the tour's page mid-run, and clean up whatever
  // the tour created.
  useEffect(() => {
    if (running && activeConfig && location.pathname !== activeConfig.path) finish();
  }, [running, location.pathname, activeConfig, finish]);

  useEffect(() => {
    if (!running || !activeConfig) return undefined;
    if (phase < 0 || phase >= activeConfig.steps.length) return undefined;
    const step = activeConfig.steps[phase];
    let cancelled = false;
    clearTimers();
    stopRaf();
    // Clear the last step's spotlight only when the step needs to wait for its
    // target — a waitFor gap can leave a stale box floating over a thing that
    // has gone. For non-waitFor steps the target is found almost immediately,
    // so keeping the old box until the new one is ready makes the hand-off read
    // as a move rather than a flicker.
    if (step.waitFor) {
      setBox(null);
      setArrowBox(null);
    }
    setMarkVisible(false);
    const max = step.waitFor ? 10000 : 2000;
    const startedAt = Date.now();

    const startType = () => {
      const ids = Array.isArray(step.type) ? step.type : [];
      let i = 0;
      const typeField = (id) => {
        if (cancelled) return;
        const el = document.querySelector(`[data-gtour="${CSS.escape(id)}"]`);
        if (!el) return;
        // typeIfEmpty stops a re-run from overwriting a goal the patient already
        // set. The first run has a blank field, so the value lands.
        if (step.typeIfEmpty && el.value && el.value.trim() !== "") return;
        const val = (step.values && step.values[id]) || "";
        let k = 0;
        const tick = () => {
          if (cancelled) return;
          if (k <= val.length) {
            setNativeValue(el, val.slice(0, k));
            k += 1;
            timers.current.push(setTimeout(tick, TYPE_MS));
          } else {
            // The water goal saves on blur, not input, so the typed value never
            // lands unless the field loses focus after the last character.
            if (step.blur) el.blur();
            i += 1;
            if (i < ids.length) timers.current.push(setTimeout(() => typeField(ids[i]), 200));
          }
        };
        tick();
      };
      if (ids.length) typeField(ids[0]);
    };

    const findRow = () => {
      const rows = document.querySelectorAll(activeConfig.rowSelector);
      const match = String(activeConfig.rowMatch).toLowerCase();
      for (const r of rows) {
        if (r.textContent.toLowerCase().includes(match)) {
          if (activeConfig.rowChild) {
            const c = r.querySelector(activeConfig.rowChild);
            if (c) return c;
          }
          return r;
        }
      }
      return null;
    };

    const findTarget = () => {
      let el;
      if (step.find === "row") el = findRow();
      else el = document.querySelector(`[data-gtour="${CSS.escape(step.target)}"]`);
      // A step can ask to wait until a control is enabled — the card checkbox
      // stays disabled until the tracker toggle's save lands, so polling for
      // the element alone would find it and then click a disabled button.
      if (el && step.waitForEnabled && el.disabled) return null;
      return el;
    };

    // Re-read the target's rect on every frame and write it straight to the
    // spotlight, so it follows a scroll live and is right no matter which
    // element scrolls.
    const startRaf = (el, arrowEl) => {
      stopRaf();
      const tick = () => {
        if (cancelled) return;
        if (!el.isConnected) { stopRaf(); return; }
        setBox(boxOf(el));
        if (arrowEl && arrowEl.isConnected) setArrowBox(boxOf(arrowEl));
        else setArrowBox(null);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const begin = (el) => {
      if (cancelled) return;
      setBox(boxOf(el));
      const arrowEl = step.arrowTarget
        ? document.querySelector(`[data-gtour="${CSS.escape(step.arrowTarget)}"]`)
        : null;
      if (arrowEl) setArrowBox(boxOf(arrowEl));
      setMarkVisible(false);
      if (step.markAt != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(true); }, step.markAt));
      } else {
        setMarkVisible(true);
      }
      if (step.markGone != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(false); }, step.markGone));
      }
      if (Array.isArray(step.type) && step.type.length) startType();
      if (step.click || step.openSelect) {
        const clickId = step.clickTarget || step.target;
        timers.current.push(setTimeout(() => {
          if (cancelled) return;
          const t = step.find === "row" ? findRow() : document.querySelector(`[data-gtour="${CSS.escape(clickId)}"]`);
          if (!t) return;
          // clickIfOff stops a re-run from toggling an already-on tracker back
          // off: the switch and the card checkbox carry aria-checked, and the
          // PDF scope toggle carries aria-pressed.
          if (step.clickIfOff && (t.getAttribute("aria-checked") === "true" || t.getAttribute("aria-pressed") === "true")) return;
          if (step.openSelect) {
            try { t.showPicker(); } catch { t.click(); }
          } else {
            t.click();
          }
        }, step.clickAt));
      }
      startRaf(el, arrowEl);
      // waitForTap steps do not auto-advance — the Next button in the note bar
      // moves on, so the patient can read and interact at her own pace.
      if (!step.waitForTap) {
        timers.current.push(setTimeout(() => {
          if (cancelled) return;
          if (phase === activeConfig.steps.length - 1) { finish(); return; }
          setPhase((p) => p + 1);
        }, step.ms));
      }
    };

    // The spotlight appears immediately and the RAF loop tracks the target
    // through any scroll, so the hand-off from the last step's box to this
    // one has no gap. The old scroll-settle wait left a flicker between steps.
    const place = (el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      begin(el);
    };

    const poll = () => {
      if (cancelled) return;
      const el = findTarget();
      if (el) { place(el); return; }
      // A missing target advances rather than ending the tour: conditional
      // targets (e.g. PDF "All records" only when there are multiple
      // surgeries) should be skipped, not abort the whole walkthrough.
      if (Date.now() - startedAt > max) {
        if (phase === activeConfig.steps.length - 1) { finish(); return; }
        setPhase((p) => p + 1);
        return;
      }
      timers.current.push(setTimeout(poll, 120));
    };

    poll();

    return () => { cancelled = true; clearTimers(); stopRaf(); };
  }, [running, phase, activeConfig, finish]);

  if (!running || !activeConfig || phase < 0 || phase >= activeConfig.steps.length) return null;
  const step = activeConfig.steps[phase];
  const isLast = phase === activeConfig.steps.length - 1;
  const nextStep = () => {
    if (isLast) { finish(); return; }
    setPhase((p) => p + 1);
  };

  return createPortal(
    <>
      {box && <div className="gtour-spot" style={box} aria-hidden="true" />}
      {box && markVisible && step.mark === "arrow" && <Arrow box={box} />}
      {box && markVisible && step.mark === "circle" && <Circle box={box} />}
      {markVisible && arrowBox && step.arrowTarget && <Arrow box={arrowBox} />}
      <div className="gtour-note-wrap" role="status" aria-live="polite">
        <div className="nb-card gtour-note">
          <span key={phase} className="gtour-note-text">{step.note}</span>
          <button type="button" onClick={step.waitForTap ? nextStep : finish} className="nb-btn h-9 px-3 shrink-0 bg-primary text-primary-foreground text-xs">
            {isLast ? "Done" : step.waitForTap ? "Next" : "Skip"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}