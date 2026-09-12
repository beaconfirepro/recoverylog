import { describe, expect, it } from "vitest";
import { MARKS, TONES, TOURS, buttonLabel, hasTour, isLastStep, movesTo, stepAt, toneClass, tourFor } from "@/lib/tour";

describe("the check-in tour", () => {
  const t = TOURS.checkins;

  it("runs the six steps it was written for", () => {
    expect(t).toHaveLength(6);
  });

  it("gives every step a target, a mark it knows, a line and a duration", () => {
    for (const s of t) {
      expect(typeof s.target).toBe("string");
      expect(s.target.length).toBeGreaterThan(0);
      expect(MARKS).toContain(s.mark);
      expect(typeof s.note).toBe("string");
      expect(s.note.length).toBeGreaterThan(0);
      expect(s.ms).toBeGreaterThan(0);
    }
  });

  it("says the lines in the order they were written", () => {
    expect(t.map((s) => s.note)).toEqual([
      "Go to Setup to set the names and times for your check-ins.",
      "Four default times have been already set.",
      "Delete any that you don't need.",
      "Add any that you may want.",
      "Scroll down to select which of the check-in areas you want to use by toggling them pink for on and white for off.",
      "Turning these off does not lose existing data."
    ]);
  });
});

describe("tourFor", () => {
  it("finds a tour that exists", () => {
    expect(tourFor("checkins")).toBe(TOURS.checkins);
  });

  it("answers null for an orientation item with no tour, rather than an empty one", () => {
    expect(tourFor("garments")).toBeNull();
    expect(tourFor(undefined)).toBeNull();
  });

  it("hasTour agrees", () => {
    expect(hasTour("checkins")).toBe(true);
    expect(hasTour("garments")).toBe(false);
  });
});

describe("stepAt", () => {
  const t = [{ target: "a" }, { target: "b" }];

  it("returns the step", () => {
    expect(stepAt(t, 0).target).toBe("a");
  });

  it("returns null past the end, which is how the tour ends", () => {
    expect(stepAt(t, 2)).toBeNull();
  });

  it("returns null before the start and for a tour that is not a list", () => {
    expect(stepAt(t, -1)).toBeNull();
    expect(stepAt(null, 0)).toBeNull();
  });
});

describe("movesTo", () => {
  const t = [{ target: "a" }, { target: "b" }, { target: "b" }];

  it("names the target on the first step", () => {
    expect(movesTo(t, 0)).toBe("a");
  });

  it("names it when the target changes", () => {
    expect(movesTo(t, 1)).toBe("b");
  });

  it("asks for no scroll when two steps sit on the same thing", () => {
    expect(movesTo(t, 2)).toBeNull();
  });

  it("answers null past the end", () => {
    expect(movesTo(t, 9)).toBeNull();
  });
});

describe("buttonLabel", () => {
  const t = [{ target: "a" }, { target: "b" }];

  it("offers a way out while it is still playing", () => {
    expect(buttonLabel(t, 0)).toBe("Skip");
  });

  it("closes it on the last step", () => {
    expect(buttonLabel(t, 1)).toBe("Done");
    expect(isLastStep(t, 1)).toBe(true);
  });
});

describe("tone classes", () => {
  it("names every tone a step actually uses", () => {
    for (const s of TOURS.checkins) {
      if (s.tone) expect(TONES[s.tone]).toBeDefined();
    }
  });

  it("writes the class out in full, because Tailwind reads source text", () => {
    expect(toneClass("pink")).toBe("tour-pink");
    expect(toneClass("purple")).toBe("tour-purple");
  });

  it("falls back to a real class rather than undefined", () => {
    expect(toneClass(undefined)).toBe("tour-pink");
    expect(toneClass("chartreuse")).toBe("tour-pink");
  });
});
