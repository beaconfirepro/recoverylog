// Guided tours: what each orientation step actually shows you.
//
// The tours themselves live in gtours.js and run through the GuidedTours
// engine (mounted in the layout, so they work on any page). This file keeps
// the helpers that the highlight hook and the legacy TourOverlay still import,
// and answers the two questions the orientation system asks: does this key
// have a tour (so the plain ring stands down), and — for the legacy renderer —
// which tour. Every real tour now returns null here, because GuidedTours owns
// the screen.

import { TOURS as GTOURS } from "@/lib/gtours";

// How a step marks its target.
//   spot   — light it and grey everything else. The default.
//   circle — spot, plus a ring drawn round it. For one control among many.
//   arrow  — spot, plus an arrow pointing down at it. For a thing to press.
export const MARKS = ["spot", "circle", "arrow"];

// The simple-tour registry is empty on purpose: every orientation tour runs
// through GuidedTours. Kept as an empty object so imports that read it (and
// the tests) still resolve.
export const TOURS = {};

export const hasTour = (key) => !!GTOURS[key];

// The legacy TourOverlay renderer is no longer handed a tour; GuidedTours is.
export const tourFor = () => null;

// The step at an index, or null past the end. Null is how the renderer learns
// the tour is over, so it is a real answer rather than a guard.
export const stepAt = (tour, i) => (Array.isArray(tour) && i >= 0 && i < tour.length ? tour[i] : null);

export const isLastStep = (tour, i) => Array.isArray(tour) && i === tour.length - 1;

// Two steps in a row on the same target do not move anything — the words
// change and the spotlight stays put. Asking for a scroll there would jog the
// page for no reason.
export const movesTo = (tour, i) => {
  const now = stepAt(tour, i);
  const before = stepAt(tour, i - 1);
  if (!now) return null;
  return before && before.target === now.target ? null : now.target;
};

// What the button says. It is the same button throughout — the tour plays on
// its own and this is the way out of it — so it only changes at the end.
export const buttonLabel = (tour, i) => (isLastStep(tour, i) ? "Done" : "Skip");