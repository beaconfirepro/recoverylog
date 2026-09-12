import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NoteBar from "@/components/NoteBar";
import { buttonLabel, movesTo, stepAt, toneClass } from "@/lib/tour";

// Draws a tour: greys the screen, leaves one thing lit, marks it, and lets
// NoteBar say the line.
//
// Everything is placed in VIEWPORT coordinates and re-measured every frame
// while a step is up.
//
// It was written the other way first — document coordinates, measured once
// after the scroll settled — and shipped a grey screen with the spotlight
// stranded below the fold. That depends on two things being true: that the
// window is the scroller, and that the scroll actually took. Neither holds
// inside the Base44 preview, where the app sits in an iframe and something
// outside it does the scrolling. `window.scrollY` stayed 0, so a box measured
// at document y≈900 was drawn 900px down a viewport that had never moved,
// while the shadow greyed everything regardless.
//
// getBoundingClientRect is the one measurement that cannot lie about where a
// thing visually is, whoever scrolled. Reading it every frame costs a rAF for
// the few seconds a tour runs and removes the assumption entirely, which is
// also what makes the marks track a smooth scroll live rather than jumping to
// where it ended.
//
// NoteBar is fixed too, and stays still on purpose: the words hold while the
// thing they are about moves under them.
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

const boxOf = (el) => {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
};

const same = (a, b) =>
  !!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

export default function TourOverlay({ tour, onDone }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState(null);
  const stepTimer = useRef(null);
  const rafId = useRef(null);

  const step = stepAt(tour, i);

  const finish = useCallback(() => {
    clearTimeout(stepTimer.current);
    cancelAnimationFrame(rafId.current);
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

    // Asked for, not relied on. When the window is the scroller this brings the
    // target into view; when something else is, the frame loop below still
    // draws in the right place.
    if (movesTo(tour, i)) el.scrollIntoView({ behavior: "smooth", block: "center" });

    // One loop, running for as long as the step is up. It covers the smooth
    // scroll, a reflow when a font lands, a rotation, and the keyboard opening
    // — every reason the box moves, without a listener for each.
    let last = null;
    const follow = () => {
      const next = boxOf(el);
      if (!same(next, last)) {
        last = next;
        setBox(next);
      }
      rafId.current = requestAnimationFrame(follow);
    };
    follow();

    stepTimer.current = setTimeout(() => setI((n) => n + 1), step.ms);

    return () => {
      clearTimeout(stepTimer.current);
      cancelAnimationFrame(rafId.current);
    };
  }, [tour, i, step, finish]);

  if (!step || !box) return null;

  const style = { top: box.top, left: box.left, width: box.width, height: box.height };

  return createPortal(
    <>
      {/* A bare stacking context. Each mark inside is fixed and carries its own
          viewport coordinates, so this only has to sit above the page. */}
      <div className="fixed top-0 left-0 w-0 h-0 z-50" aria-hidden="true">
        <div className="tour-spot" style={style} />
        {step.mark === "circle" && <div className={`tour-circle ${toneClass(step.tone)}`} style={style} />}
        {step.mark === "arrow" && (
          <div
            className={`tour-arrow ${toneClass(step.tone)}`}
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
