import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NoteBar from "@/components/NoteBar";
import { buttonLabel, movesTo, stepAt } from "@/lib/tour";

// Draws a tour: greys the screen, leaves one thing lit, marks it, and lets
// NoteBar say the line.
//
// The whole layer is positioned in DOCUMENT coordinates, not viewport ones, so
// it scrolls with the page it is describing. A fixed layer would need the
// scroll handler nobody gets right — every frame, on a phone, behind a smooth
// scroll that is already animating. Absolute boxes just move, because the page
// moves them.
//
// NoteBar is the exception and is fixed on purpose: the words stay still while
// the thing they are about scrolls under them.
//
// A step whose target is not in the DOM is skipped rather than drawn somewhere
// plausible. Screens change; a tour that points confidently at the wrong place
// is worse than one that admits a step is gone.
//
// It renders through a portal to <body>, and has to. <main> carries
// `isolation: isolate` so that nothing in a page can paint over the tab bar —
// right for the app, fatal for an overlay, which would have greyed the page and
// left the bars lit on top of it. <main> also animates in on a transform, and a
// transformed ancestor is a containing block for absolutely positioned
// children and for fixed ones too, so both the spotlight's page coordinates and
// NoteBar's pinning would have been measured from the wrong origin. The portal
// steps outside both.

const PAD = 8;
// Long enough for a smooth scroll to land before the spotlight is measured. The
// alternative is watching scrollY settle, which the single highlight does and
// which is more machinery than a tour needs — it is already waiting seconds.
const SETTLE_MS = 420;

const boxOf = (el) => {
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY - PAD,
    left: r.left + window.scrollX - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2
  };
};

export default function TourOverlay({ tour, onDone }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState(null);
  const stepTimer = useRef(null);
  const settleTimer = useRef(null);

  const step = stepAt(tour, i);

  const finish = useCallback(() => {
    clearTimeout(stepTimer.current);
    clearTimeout(settleTimer.current);
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!step) {
      finish();
      return undefined;
    }

    const el = document.querySelector(`[data-tour="${CSS.escape(step.target)}"]`);
    if (!el) {
      // Nothing to point at. Move on rather than draw a spotlight over empty
      // page, and do it in a timeout so a run of missing steps does not recurse
      // through setState in one tick.
      stepTimer.current = setTimeout(() => setI((n) => n + 1), 0);
      return () => clearTimeout(stepTimer.current);
    }

    const place = () => {
      setBox(boxOf(el));
      stepTimer.current = setTimeout(() => setI((n) => n + 1), step.ms);
    };

    if (movesTo(tour, i)) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Measured after the scroll, because the box is wanted where the thing
      // ends up rather than where it started.
      settleTimer.current = setTimeout(place, SETTLE_MS);
    } else {
      place();
    }

    return () => {
      clearTimeout(stepTimer.current);
      clearTimeout(settleTimer.current);
    };
  }, [tour, i, step, finish]);

  // The page reflows under a tour — a font lands, an image sizes — and a
  // spotlight measured before that is then over the wrong place.
  useEffect(() => {
    if (!step) return undefined;
    const remeasure = () => {
      const el = document.querySelector(`[data-tour="${CSS.escape(step.target)}"]`);
      if (el) setBox(boxOf(el));
    };
    window.addEventListener("resize", remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, [step]);

  if (!step || !box) return null;

  const style = { top: box.top, left: box.left, width: box.width, height: box.height };

  return createPortal(
    <>
      {/* Absolute, in a layer pinned to the document's top-left, so everything
          inside is in page coordinates and scrolls with the page. */}
      <div className="absolute top-0 left-0 w-0 h-0 z-50" aria-hidden="true">
        <div className="tour-spot" style={style} />
        {step.mark === "circle" && <div className={`tour-circle tour-${step.tone || "pink"}`} style={style} />}
        {step.mark === "arrow" && (
          <div
            className={`tour-arrow tour-${step.tone || "purple"}`}
            style={{ top: box.top - 44, left: box.left + box.width / 2 - 18 }}
          >
            <svg viewBox="0 0 36 40" width="36" height="40" fill="none">
              <path
                d="M18 2 V30"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M7 21 L18 34 L29 21"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <NoteBar text={step.note}>
        <button type="button" onClick={finish} className="nb-btn h-9 px-3 shrink-0 bg-card text-xs">
          {buttonLabel(tour, i)}
        </button>
      </NoteBar>
    </>,
    document.body
  );
}
