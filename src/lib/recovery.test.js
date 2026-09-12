import { describe, expect, it } from "vitest";
import {
  CHECKIN_MEASURES,
  DEFAULT_CHECKIN_SLOTS,
  MEASUREMENTS,
  checkinConfig,
  checkinSlots,
  defaultSlot,
  measurementSpots
} from "@/lib/recovery";
import { BODY_PARTS, MARKS } from "@/lib/bodyMap";
import { trackedTypes } from "@/lib/PatientContext";

// Three settings share one rule: empty means the built-in set, because a list
// nobody has narrowed is not a list of nothing. Getting that backwards empties
// the app for anyone who never opened Setup.

describe("check-in slots", () => {
  it("falls back to the built-in four", () => {
    expect(checkinSlots(null)).toEqual(DEFAULT_CHECKIN_SLOTS);
    expect(checkinSlots({})).toEqual(DEFAULT_CHECKIN_SLOTS);
    expect(checkinSlots({ checkin_slots: [] })).toEqual(DEFAULT_CHECKIN_SLOTS);
  });

  it("uses what she saved", () => {
    const mine = [{ label: "Waking", time: "06:30" }, { label: "Bedtime", time: "22:00" }];
    expect(checkinSlots({ checkin_slots: mine })).toEqual(mine);
  });

  it("drops a slot with no name", () => {
    // The check-in form picks a slot by its label, so an unnamed row would be
    // an unpickable chip. The Setup editor keeps them; this does not.
    const saved = [{ label: "Waking", time: "07:00" }, { label: "", time: "" }];
    expect(checkinSlots({ checkin_slots: saved })).toHaveLength(1);
  });
});

describe("defaultSlot", () => {
  it("picks a slot rather than nothing", () => {
    expect(DEFAULT_CHECKIN_SLOTS.map((s) => s.label)).toContain(defaultSlot(DEFAULT_CHECKIN_SLOTS));
  });

  it("falls back to the built-ins when handed nothing", () => {
    expect(defaultSlot([])).toBeTruthy();
    expect(defaultSlot(null)).toBeTruthy();
  });
});

describe("checkinConfig", () => {
  it("asks every measure by default", () => {
    const cfg = checkinConfig({});
    const keys = cfg.fields.map((f) => f.key);
    for (const m of CHECKIN_MEASURES) expect(keys).toContain(m.key);
  });

  it("asks only the ones she kept", () => {
    const cfg = checkinConfig({ checkin_measures: ["pain", "mood"] });
    const keys = cfg.fields.map((f) => f.key);
    expect(keys).toContain("pain");
    expect(keys).toContain("mood");
    expect(keys).not.toContain("nausea");
  });

  it("always leads with the slot", () => {
    expect(checkinConfig({}).fields[0].key).toBe("slot");
  });

  it("offers her own slot names as the chips", () => {
    const cfg = checkinConfig({ checkin_slots: [{ label: "First thing", time: "06:00" }] });
    expect(cfg.fields[0].options).toEqual(["First thing"]);
  });
});

describe("measurement spots", () => {
  it("falls back to the built-in set", () => {
    expect(measurementSpots(null)).toEqual(MEASUREMENTS);
    expect(measurementSpots({ measurements: [] })).toEqual(MEASUREMENTS);
  });

  it("keeps her order", () => {
    const out = measurementSpots({ measurements: ["Waist", "Bicep"] });
    expect(out.map((m) => m.name)).toEqual(["Waist", "Bicep"]);
  });

  it("keeps the left-and-right pair on a built-in name", () => {
    expect(measurementSpots({ measurements: ["Bicep"] })[0].pair).toBe(true);
  });

  it("treats a name she typed as a single figure", () => {
    // Nothing else knows a spot she invented has two sides.
    expect(measurementSpots({ measurements: ["Left ankle bone"] })[0].pair).toBeUndefined();
  });
});

describe("tracked types", () => {
  it("offers everything when nothing is chosen", () => {
    expect(trackedTypes(null).length).toBeGreaterThan(0);
    expect(trackedTypes({ tracked_types: [] })).toEqual(trackedTypes(null));
  });

  it("cannot put back a retired type or the pinned check-in", () => {
    const out = trackedTypes({ tracked_types: ["water", "checkin", "nonsense"] });
    expect(out).toEqual(["water"]);
  });
});

describe("the body map", () => {
  it("lists every part exactly once", () => {
    expect(new Set(BODY_PARTS).size).toBe(BODY_PARTS.length);
  });

  it("mirrors left and right between the views", () => {
    // Left and right are the patient's, so her left is on the right of the
    // front view and the left of the back. Getting this backwards puts a
    // finding on the wrong leg in a record a surgeon reads.
    expect(MARKS.front["Left thigh"][0]).toBeGreaterThan(100);
    expect(MARKS.front["Right thigh"][0]).toBeLessThan(100);
    expect(MARKS.back["Left hamstring"][0]).toBeLessThan(100);
    expect(MARKS.back["Right hamstring"][0]).toBeGreaterThan(100);
  });

  it("keeps no two marks close enough to mis-tap", () => {
    for (const side of ["front", "back"]) {
      const pts = Object.entries(MARKS[side]);
      for (let i = 0; i < pts.length; i += 1) {
        for (let j = i + 1; j < pts.length; j += 1) {
          const [an, [ax, ay]] = pts[i];
          const [bn, [bx, by]] = pts[j];
          const d = Math.hypot(ax - bx, ay - by);
          expect(d, `${an} and ${bn} on the ${side}`).toBeGreaterThan(16);
        }
      }
    }
  });

  it("keeps every mark inside the drawing", () => {
    for (const side of ["front", "back"]) {
      for (const [name, [x, y]] of Object.entries(MARKS[side])) {
        expect(x, name).toBeGreaterThan(8);
        expect(x, name).toBeLessThan(192);
        expect(y, name).toBeGreaterThan(8);
        expect(y, name).toBeLessThan(462);
      }
    }
  });

  it("still names both calves, which the calf red flag matches on", () => {
    expect(BODY_PARTS.filter((p) => p.endsWith("calf"))).toHaveLength(2);
  });
});
