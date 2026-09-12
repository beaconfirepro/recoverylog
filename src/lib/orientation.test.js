import { describe, expect, it } from "vitest";
import { ORIENTATION_ITEMS, allDone, deriveDone, doneCount, isDone } from "@/lib/orientation";

const blank = { items: {} };

describe("deriveDone", () => {
  it("answers every step the app can actually see", () => {
    // Ten steps, nine of which leave a trace. "pdf" is the exception and is
    // deliberately absent: opening a PDF leaves nothing behind.
    const derived = deriveDone({});
    const keys = ORIENTATION_ITEMS.map((i) => i.key);
    for (const k of keys) {
      if (k === "pdf") expect(derived[k], k).toBeUndefined();
      else expect(derived[k], k).toBe(false);
    }
  });

  it("counts a real surgery, not the auto-created maintenance record", () => {
    // A maintenance row is created for her, so its existence is not a choice
    // she made and must not tick the step that asks her to choose.
    expect(deriveDone({ hasRealSurgery: true }).surgery).toBe(true);
    expect(deriveDone({ hasRealSurgery: false }).surgery).toBe(false);
  });

  it("counts choosing maintenance out loud as an answer", () => {
    expect(deriveDone({ choice: "maintenance" }).surgery).toBe(true);
  });

  it("reads each remaining step off its own fact", () => {
    expect(deriveDone({ hasNamedCheckinSlot: true }).checkins).toBe(true);
    expect(deriveDone({ hasChosenTrackers: true }).trackers).toBe(true);
    expect(deriveDone({ hasChosenMeasurements: true }).measurements).toBe(true);
    expect(deriveDone({ hasGarment: true }).garments).toBe(true);
    expect(deriveDone({ hasMedGroup: true }).meds).toBe(true);
    expect(deriveDone({ hasTeamMember: true }).careteam).toBe(true);
    expect(deriveDone({ hasCheckin: true }).firstcheckin).toBe(true);
    expect(deriveDone({ hasRedFlagAnswer: true }).redflags).toBe(true);
  });
});

describe("isDone", () => {
  it("takes the app's word when the app can see it", () => {
    expect(isDone("garments", blank, { garments: true })).toBe(true);
  });

  it("still takes hers when it cannot", () => {
    // "No, I am not wearing compression" is a real answer that leaves no
    // garment behind, and opening the PDF leaves no trace at all.
    expect(isDone("garments", { items: { garments: true } }, { garments: false })).toBe(true);
    expect(isDone("pdf", { items: { pdf: true } }, {})).toBe(true);
  });

  it("is not done when neither says so", () => {
    expect(isDone("meds", blank, {})).toBe(false);
  });
});

describe("the count", () => {
  it("is zero on a fresh log", () => {
    expect(doneCount(blank, deriveDone({}))).toBe(0);
    expect(allDone(blank, deriveDone({}))).toBe(false);
  });

  it("counts what the app sees without her ticking anything", () => {
    const derived = deriveDone({ hasRealSurgery: true, hasCheckin: true, hasGarment: true });
    expect(doneCount(blank, derived)).toBe(3);
  });

  it("does not double-count a step she also ticked", () => {
    const derived = deriveDone({ hasGarment: true });
    expect(doneCount({ items: { garments: true } }, derived)).toBe(1);
  });

  it("is finished only when the last one is, pdf included", () => {
    const all = {
      hasRealSurgery: true, hasNamedCheckinSlot: true, hasChosenTrackers: true,
      hasChosenMeasurements: true, hasGarment: true, hasMedGroup: true,
      hasTeamMember: true, hasCheckin: true, hasRedFlagAnswer: true
    };
    const derived = deriveDone(all);
    expect(allDone(blank, derived)).toBe(false);
    expect(allDone({ items: { pdf: true } }, derived)).toBe(true);
  });
});
