// Guided tours: what each orientation step actually shows you.
//
// The single highlight — grey the screen, ring one heading — answers "where is
// it". It cannot answer "what do I do with it", and for a setup screen that is
// the whole question. A patient who lands on Check-in sees four times already
// filled in and no way to tell whether that is a suggestion, a requirement, or
// something she has already done.
//
// So a tour is a list of steps over one screen. Each step lights one thing,
// optionally marks it, and says one line about it. The data lives here, apart
// from the renderer, because the wording is the part that gets revised and
// nobody should have to read animation code to change a sentence.
//
// `target` is a [data-tour] attribute in the page. A step whose target is not
// on screen is skipped rather than guessed at — see the renderer — so a tour
// stays honest when a screen changes under it.

// Tone classes are written out in full, and must be. Tailwind tree-shakes
// hand-written `@layer components` rules against what it can find in the
// source, and it reads text — not runtime strings. `tour-${tone}` built in a
// template literal is invisible to it, so the rules were emitted into
// index.css and then dropped from the bundle: the circle and the arrow shipped
// with no colour at all. Naming them here keeps them literal, and the test
// pins that every tone a step can carry has an entry.
export const TONES = {
  pink: "tour-pink",
  purple: "tour-purple"
};

export const toneClass = (tone) => TONES[tone] || TONES.pink;

// How a step marks its target.
//   spot   — light it and grey everything else. The default.
//   circle — spot, plus a ring drawn round it. For one control among many.
//   arrow  — spot, plus an arrow pointing down at it. For a thing to press.
export const MARKS = ["spot", "circle", "arrow"];

// Long enough to read the line and look at what it points at. The line is the
// slower of the two, so these are set off the words rather than the drawing.
const READ_MS = 3200;
const SHORT_MS = 2600;

export const TOURS = {
  checkins: [
    {
      target: "checkin-card",
      mark: "spot",
      note: "Go to Setup to set the names and times for your check-ins.",
      ms: READ_MS
    },
    {
      target: "checkin-times",
      mark: "spot",
      note: "Four default times have been already set.",
      ms: SHORT_MS
    },
    {
      target: "checkin-remove",
      mark: "circle",
      tone: "pink",
      note: "Delete any that you don't need.",
      ms: SHORT_MS
    },
    {
      target: "checkin-add",
      mark: "arrow",
      tone: "purple",
      note: "Add any that you may want.",
      ms: SHORT_MS
    },
    {
      target: "checkin-records",
      mark: "spot",
      note:
        "Scroll down to select which of the check-in areas you want to use by toggling them pink for on and white for off.",
      ms: 4200
    },
    {
      target: "checkin-records",
      mark: "spot",
      note: "Turning these off does not lose existing data.",
      ms: READ_MS
    }
  ]
};

export const tourFor = (key) => TOURS[key] || null;

export const hasTour = (key) => Array.isArray(TOURS[key]) && TOURS[key].length > 0;

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
