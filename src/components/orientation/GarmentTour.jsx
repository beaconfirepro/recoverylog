import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

// The garment orientation step is a scripted tour rather than a single ring.
// It peeks through the card title, types a sample garment into the two fields,
// points a purple arrow at the add button (and presses it), then rings the
// remove button in pink.
//
// It is self-contained on purpose. The tour system in TourOverlay/NoteBar lands
// from GitHub on its own schedule; this does not wait for it. It neutralises the
// plain orientation highlight itself — by pulling the data-orient attribute
// off the heading in a useLayoutEffect, which runs before the highlight's
// useEffect can find it — so it works before and after that sync.

const NOTES = [
  "Add your compression garments for easy tracking.",
  "Use the colour, brand, or whatever makes sense to identify it, and track the size so you know if you need to size down or what you are replacing.",
  "Add the garment to your list and it will be available for all surgeries and maintenance to select when tracking compression garment use.",
  "If you no longer use a compression garment, click the x to remove it from your list. It will not disappear from your logs."
];

const NAME = "Sample Garment";
const SIZE = "Size M";
const PAD = 8;
const SETTLE_MS = 450;
const TYPE_MS = 65;

const STEPS = [
  { target: "garments-header", mark: "spot", note: NOTES[0], ms: 1200 },
  { target: "garments-inputs", mark: "spot", note: NOTES[1], ms: 3600, type: true },
  { target: "garments-add", mark: "arrow", note: NOTES[2], ms: 8400, click: true, clickAt: 3000, markAt: 1200, markGone: 7200 },
  { target: "garments-remove", mark: "circle", note: NOTES[3], ms: 5200, waitFor: true, markAt: 1200, markGone: 5000 }
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

export default function GarmentTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [box, setBox] = useState(null);
  const [markVisible, setMarkVisible] = useState(false);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const finish = useCallback(() => {
    clearTimers();
    // A skipped tour must not leave half-typed sample text in the form.
    setNativeValue(document.querySelector('[data-gtour="garments-name"]'), "");
    setNativeValue(document.querySelector('[data-gtour="garments-size"]'), "");
    setBox(null);
    setMarkVisible(false);
    setRunning(false);
  }, []);

  // Latch on the trigger, then drop the navigation state so a back/forward does
  // not replay. The data-orient attribute is pulled before the highlight's
  // useEffect runs (useLayoutEffect runs first), so the plain ring never finds
  // its target and this tour owns the screen.
  useLayoutEffect(() => {
    const want = location.pathname === "/profile" && location.state?.orient === "garments";
    if (!want || running) return;
    setRunning(true);
    setPhase(0);
    setBox(null);
    const heading = document.querySelector('[data-orient="garments"]');
    if (heading) heading.removeAttribute("data-orient");
    navigate(location.pathname, { replace: true, state: null });
  }, [location, running, navigate]);

  // Stop if the patient leaves Setup mid-tour.
  useEffect(() => {
    if (running && location.pathname !== "/profile") finish();
  }, [running, location.pathname, finish]);

  useEffect(() => {
    if (!running || phase < 0 || phase >= STEPS.length) return undefined;
    const step = STEPS[phase];
    let cancelled = false;
    clearTimers();
    const max = step.waitFor ? 8000 : 2000;
    const startedAt = Date.now();

    const startTyping = () => {
      const nameEl = document.querySelector('[data-gtour="garments-name"]');
      const sizeEl = document.querySelector('[data-gtour="garments-size"]');
      let k = 0;
      const typeName = () => {
        if (cancelled) return;
        if (k < NAME.length) {
          k += 1;
          setNativeValue(nameEl, NAME.slice(0, k));
          timers.current.push(setTimeout(typeName, TYPE_MS));
        } else {
          let j = 0;
          const typeSize = () => {
            if (cancelled) return;
            if (j < SIZE.length) {
              j += 1;
              setNativeValue(sizeEl, SIZE.slice(0, j));
              timers.current.push(setTimeout(typeSize, TYPE_MS));
            }
          };
          timers.current.push(setTimeout(typeSize, 160));
        }
      };
      timers.current.push(setTimeout(typeName, 280));
    };

    const begin = (el) => {
      if (cancelled) return;
      setBox(boxOf(el));
      setMarkVisible(false);
      // The mark draws in partway through, after the spotlight has had the
      // floor, and leaves before the phase ends so the next highlight is clean.
      if (step.markAt != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(true); }, step.markAt));
      }
      if (step.markGone != null) {
        timers.current.push(setTimeout(() => { if (!cancelled) setMarkVisible(false); }, step.markGone));
      }
      if (step.type) startTyping();
      if (step.click) {
        timers.current.push(setTimeout(() => { if (!cancelled) el.click(); }, step.clickAt));
      }
      timers.current.push(setTimeout(() => {
        if (!cancelled) setPhase((p) => p + 1);
      }, step.ms));
    };

    const place = (el) => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      timers.current.push(setTimeout(() => begin(el), SETTLE_MS));
    };

    const findTarget = () => {
      if (step.waitFor) {
        let found = null;
        document.querySelectorAll('[data-gtour="garments-row"]').forEach((row) => {
          if (row.textContent.includes(NAME)) {
            const x = row.querySelector('[data-gtour="garments-remove"]');
            if (x) found = x;
          }
        });
        return found;
      }
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

  if (!running || phase < 0 || phase >= STEPS.length || !box) return null;
  const step = STEPS[phase];
  const isLast = phase === STEPS.length - 1;
  const spotStyle = { top: box.top, left: box.left, width: box.width, height: box.height };

  return createPortal(
    <>
      <div className="gtour-spot" style={spotStyle} aria-hidden="true" />
      {step.mark === "arrow" && markVisible && (
        <div
          className="gtour-arrow"
          aria-hidden="true"
          style={{ top: box.top - 48, left: box.left + box.width / 2 - 18 }}
        >
          <svg viewBox="0 0 36 48" width="36" height="48" fill="none">
            <path className="gtour-arrow-shaft" d="M18 4 V36" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path className="gtour-arrow-head" d="M7 27 L18 40 L29 27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {step.mark === "circle" && markVisible && (
        <svg className="gtour-circle" style={spotStyle} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="gtour-circle-path"
            d="M50 5 C75 5 95 25 95 50 C95 75 75 95 50 95 C25 95 5 75 5 50 C5 25 25 5 50 5 Z"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
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