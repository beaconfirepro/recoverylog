# Guided tours

There are two ways an orientation step shows you where to go.

1. **The single highlight** (`useOrientationHighlight`): greys the screen and
   rings one heading. It answers "where is it". It is the default — every
   `data-orient` anchor gets it for free.

2. **A guided tour**: a scripted walk over one screen — spotlight, optional
   arrow/circle mark, a note line, and *actions* (typing into fields, pressing a
   button, waiting for a row that only appears after the press). It answers
   "what do I do with it".

Most steps need only the highlight. A step that has to *do* something — type a
sample, press add, then ring the remove button that only exists once add lands
— needs a tour.

## When to write a standalone tour vs. extend `TOURS`

The shared `TourOverlay` / `tour.js` system renders a spot, a circle, an arrow,
and the note line on timers. It skips any target not in the DOM. If your step
fits that — light a thing, say a line, move on — add an entry to `TOURS` in
`src/lib/tour.js` and put `data-tour="…"` anchors in the page. No new component.

If your step has to **mutate the page mid-tour** (type into a controlled input,
click a button, wait for a row that the click creates), the shared renderer
cannot express it. Write a standalone tour component instead. The garment tour
(`src/components/orientation/GarmentTour.jsx`) is the canonical example — copy
its shape.

## The standalone pattern

A standalone tour is one component, mounted once from `Layout.jsx`, that owns
one orientation key. It is self-contained: it does not import `TourOverlay`,
`NoteBar`, or `tour.js`, so it works before and after that system changes.

### Trigger

Tours are keyed on the orientation `highlight` value. The checklist navigates
with `state: { orient: <highlight> }` (see `onNavigate` in `Home.jsx`). A
standalone tour latches on that in a `useLayoutEffect`:

```js
useLayoutEffect(() => {
  const want = location.pathname === "/profile" && location.state?.orient === "garments";
  if (!want || running) return;
  setRunning(true);
  // Drop the navigation state so a back/forward does not replay.
  navigate(location.pathname, { replace: true, state: null });
}, [location, running, navigate]);
```

Use `useLayoutEffect`, not `useEffect`, for the latch — see "Neutralise the
highlight" below.

### Anchors

The page marks tour targets with `data-gtour="<id>"` attributes (short for
"guided-tour"), separate from the `data-orient` highlight anchors and the
`data-tour` shared-system anchors. Each is its own namespace; they do not
collide.

```jsx
<div data-gtour="garments-header">…</div>
<input data-gtour="garments-name" … />
<button data-gtour="garments-add" … />
```

### Steps

A tour is a `STEPS` array. Each step has a `target` (a `data-gtour` id), a
`mark` (`"spot"` | `"arrow"` | `"circle"`), a `note` (the line), and `ms` (how
long the step holds). Optional action fields:

- `type: true` — type sample text into the tour's inputs.
- `click: true` + `clickAt` — press the target `clickAt` ms into the step.
- `waitFor: true` — the target does not exist yet; poll for it (e.g. the remove
  button on a row the previous step's click just created).
- `markAt` / `markGone` — when the arrow/circle draws in and leaves, so the next
  spotlight starts clean.

### Lifecycle

- One `useEffect` per `phase` does the work: poll for the target, scroll it into
  view, settle, then `begin` — set the spotlight box, schedule the mark, the
  optional typing/click, and the advance to the next phase.
- A `finish` callback clears all timers, wipes any half-typed sample text, and
  drops `running`. It is the Skip/Done button and the cleanup on unmount.
- Stop if the patient leaves the page mid-tour.

### Typing into controlled inputs

React-controlled inputs ignore a plain `el.value = …`. Set through the
prototype's setter and dispatch the `input` event — that is what makes the
change land in the component's state:

```js
const setNativeValue = (el, value) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
```

### Rendering

Spotlight is an absolutely-positioned box in document coordinates whose huge
`box-shadow` dims the rest of the page. The arrow and circle are SVG draws with
a `stroke-dashoffset` animation. The note is a fixed bar at the top. Render the
lot through a `createPortal(..., document.body)` so it sits above page chrome.

All styling lives in `src/index.css` under a `gtour-*` namespace — one prefix
per tour is fine (`gtour-spot`, `gtour-arrow`, …) so multiple standalone tours
never share classes.

## Coexistence with the shared system

A standalone tour must not fight the single highlight or the shared
`TourOverlay`:

1. **Neutralise the highlight.** `hasTour(<key>)` is false for a standalone key
   (it is not in `TOURS`), so the plain highlight *would* fire. Pull the
   `data-orient="<key>"` attribute off the heading in the latch
   `useLayoutEffect` — `useLayoutEffect` runs before the highlight's
   `useEffect`, so the highlight finds no target and gives up. Put the attribute
   back is unnecessary: orientation state is one-shot.

2. **Do not register the key in `TOURS`.** `tourFor(<key>)` returns null, so
   `TourOverlay` renders nothing for it. The standalone tour owns the screen.

3. **Mount from `Layout.jsx`, not the page.** A page unmounts on navigation; the
   tour needs to survive the target appearing after a click. `Layout` wraps
   every page, so a tour mounted there keeps its state across the page's own
   re-renders.

## Checklist for a new standalone tour

- [ ] Pick an orientation `highlight` key not in `TOURS`.
- [ ] Add `data-gtour="…"` anchors in the target page.
- [ ] Copy `GarmentTour.jsx`, rename, set `STEPS` and the latch key.
- [ ] Add `gtour-*` (or your own prefix) classes to `index.css`.
- [ ] Mount the component in `Layout.jsx`.
- [ ] Confirm the checklist step's `yes.target` / `target` and `highlight`
      match the tour's latch.