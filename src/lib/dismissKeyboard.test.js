import { describe, expect, it } from "vitest";
import { shouldDismiss } from "@/lib/dismissKeyboard";

// The suite runs with no DOM, which is the point: these are the smallest
// shapes the real check reads — what kind of input has focus, and whether the
// tap landed on a control.
const input = (inputMode) => ({ tagName: "INPUT", inputMode });

const target = (matches) => ({ closest: () => (matches ? {} : null) });
const background = target(false);
const control = target(true);

describe("shouldDismiss", () => {
  it("dismisses the keyboards that have no way out", () => {
    // The number pad has no Return key, and Setup's goal rows save on blur —
    // so a field she cannot blur is a goal she cannot save.
    for (const mode of ["numeric", "decimal", "tel"]) {
      expect(shouldDismiss(input(mode), background), mode).toBe(true);
    }
  });

  it("leaves alone the keyboards that have one", () => {
    // A text field has Return and a date field has its own Done bar. Taking
    // focus off those fights the user instead of helping her.
    for (const mode of ["text", "email", "search", ""]) {
      expect(shouldDismiss(input(mode), background), mode).toBe(false);
    }
  });

  it("does not steal a tap meant for another control", () => {
    // Moving from one goal field to the next must not blur and refocus.
    expect(shouldDismiss(input("numeric"), control)).toBe(false);
  });

  it("copes with nothing focused, or something that is not an input", () => {
    expect(shouldDismiss(null, background)).toBe(false);
    expect(shouldDismiss(undefined, background)).toBe(false);
    expect(shouldDismiss({}, background)).toBe(false);
    expect(shouldDismiss({ tagName: "DIV", inputMode: "numeric" }, background)).toBe(false);
  });

  it("copes with a tap on something that cannot be asked", () => {
    expect(shouldDismiss(input("numeric"), {})).toBe(true);
    expect(shouldDismiss(input("numeric"), null)).toBe(true);
  });
});
