import { describe, expect, it } from "vitest";
import { MARKS, TOURS, buttonLabel, hasTour, isLastStep, movesTo, stepAt, tourFor } from "@/lib/tour";
import { TOURS as GTOURS } from "@/lib/gtours";

describe("the tour registry", () => {
  it("has a guided tour for every orientation step that promises one", () => {
    for (const k of [
      "surgery", "checkins", "trackers", "measurements", "meds",
      "garments", "careteam", "firstcheckin", "pdf", "redflags"
    ]) {
      expect(hasTour(k), k).toBe(true);
    }
  });

  it("does not invent a tour for an unknown key", () => {
    expect(hasTour("nope")).toBe(false);
  });

  it("leaves the simple-tour registry empty — every tour runs through GuidedTours", () => {
    expect(Object.keys(TOURS)).toHaveLength(0);
    expect(tourFor("checkins")).toBeNull();
  });
});

describe("every guided tour", () => {
  for (const [key, tour] of Object.entries(GTOURS)) {
    describe(key, () => {
      it("has a path and at least one step", () => {
        expect(typeof tour.path).toBe("string");
        expect(tour.path.length).toBeGreaterThan(0);
        expect(Array.isArray(tour.steps)).toBe(true);
        expect(tour.steps.length).toBeGreaterThan(0);
      });

      it("gives every step a target, a mark it knows, a line and a duration", () => {
        for (const s of tour.steps) {
          expect(typeof s.target, `${key} step target`).toBe("string");
          expect(s.target.length, `${key} step target`).toBeGreaterThan(0);
          expect(MARKS, `${key} step mark`).toContain(s.mark);
          expect(typeof s.note, `${key} step note`).toBe("string");
          expect(s.note.length, `${key} step note`).toBeGreaterThan(0);
          expect(s.ms, `${key} step ms`).toBeGreaterThan(0);
        }
      });
    });
  }
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