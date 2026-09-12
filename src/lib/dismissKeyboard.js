import { useEffect } from "react";

// iOS shows the number pad with no Return key. On a screen that is a column of
// numeric fields — Setup's goals and per-nutrient rows — the keyboard covers
// the bottom of the page and there is nothing to tap that puts it away.
//
// It is worse than an inconvenience there: those rows save on blur, so a field
// she cannot blur is a field she cannot save. She types 64, cannot dismiss the
// pad, navigates away, and the goal was never written.
//
// Tapping outside does not reliably blur on its own, so this does it: a tap
// that lands on something which is not a form control takes focus off whatever
// numeric field has it.

const isFormControl = (el) =>
  !!el?.closest?.("input, textarea, select, button, a, [role='slider'], [contenteditable='true'], label");

// Only the keyboards with no way out. A text field has a Return key and a date
// field has its own Done bar, and stealing focus from those would fight the
// user rather than help her.
const NEEDS_HELP = ["numeric", "decimal", "tel"];

// Read off the tag rather than through instanceof, so this is the same check in
// a test as it is in a browser. The suite runs with no DOM at all, and a rule
// about which keyboard is on screen is exactly the kind of thing that should
// not need one.
const needsDismissing = (el) =>
  el?.tagName === "INPUT" && NEEDS_HELP.includes(el.inputMode || el.getAttribute?.("inputmode") || "");

export const shouldDismiss = (active, target) => needsDismissing(active) && !isFormControl(target);

export function useDismissKeyboard() {
  useEffect(() => {
    const onDown = (e) => {
      if (shouldDismiss(document.activeElement, e.target)) document.activeElement.blur();
    };
    // Capture, so a tap on a card that stops propagation still dismisses.
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);
}
