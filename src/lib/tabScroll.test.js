import { describe, expect, it } from "vitest";
import { MIN_RESTORE, canRestore, maxScroll, worthRestoring } from "@/lib/tabScroll";

// The bug this replaces: restoring while the destination was still a spinner.
// The document was one viewport tall, the browser clamped the scroll to zero,
// and the position was gone by the time the list rendered.

describe("canRestore", () => {
  it("refuses while the page is still a spinner", () => {
    // 800px of viewport, a document no taller than it, and a saved position
    // 2,000px down. This is the exact shape of the old failure.
    expect(canRestore(2000, 800, 800)).toBe(false);
  });

  it("allows it once the content is actually there", () => {
    expect(canRestore(2000, 5000, 800)).toBe(true);
  });

  it("allows the exact bottom of the document", () => {
    // 5000 - 800 = 4200 is the furthest a browser will go, and asking for
    // exactly that must not be read as asking for too much.
    expect(canRestore(4200, 5000, 800)).toBe(true);
    expect(canRestore(4201, 5000, 800)).toBe(false);
  });

  it("allows the top whatever the height", () => {
    expect(canRestore(0, 0, 800)).toBe(true);
  });
});

describe("maxScroll", () => {
  it("never goes negative on a page shorter than the screen", () => {
    expect(maxScroll(400, 800)).toBe(0);
    expect(maxScroll(0, 800)).toBe(0);
  });

  it("is the document past the fold", () => {
    expect(maxScroll(5000, 800)).toBe(4200);
  });
});

describe("worthRestoring", () => {
  it("ignores a position that is already the top of the page", () => {
    expect(worthRestoring(0)).toBe(false);
    expect(worthRestoring(MIN_RESTORE - 1)).toBe(false);
  });

  it("restores a real scroll", () => {
    expect(worthRestoring(MIN_RESTORE)).toBe(true);
    expect(worthRestoring(3200)).toBe(true);
  });

  it("copes with a tab never visited", () => {
    expect(worthRestoring(undefined)).toBe(false);
    expect(worthRestoring(null)).toBe(false);
  });
});
