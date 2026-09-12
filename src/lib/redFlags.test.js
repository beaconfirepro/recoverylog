import { describe, expect, it } from "vitest";
import { suggestFlags, UNTRACKED_FLAGS } from "@/lib/redFlags";

// These rules decide whether a patient is shown a safety question about her own
// recovery. A missed suggestion is the failure that matters, so most of these
// assert that something is raised rather than that nothing is.

const entry = (type, data) => ({ type, data, entry_time: "09:00" });
const DAY = "2026-09-12";

describe("fever", () => {
  it("raises at the surgeon's own threshold", () => {
    const s = suggestFlags([entry("temp", { temp: 101.5 })], { fever_threshold: 101.5 }, null, DAY);
    expect(s.fever?.answer).toBe("yes");
    expect(s.fever.why).toContain("101.5");
  });

  it("stays quiet below it", () => {
    expect(suggestFlags([entry("temp", { temp: 101.4 })], { fever_threshold: 101.5 }, null, DAY).fever)
      .toBeUndefined();
  });

  it("falls back to 100.4 when the surgery has no number", () => {
    expect(suggestFlags([entry("temp", { temp: 100.4 })], null, null, DAY).fever?.answer).toBe("yes");
    expect(suggestFlags([entry("temp", { temp: 100.3 })], null, null, DAY).fever).toBeUndefined();
  });
});

describe("incisions", () => {
  it("raises on a level of Risk or Issue", () => {
    const s = suggestFlags([entry("incisions", { status: { Abdomen: { level: "Risk" } } })], null, null, DAY);
    expect(s.redness?.answer).toBe("yes");
    expect(s.redness.why).toContain("Risk");
  });

  it("raises on a worrying symptom even when the level is Normal", () => {
    const s = suggestFlags(
      [entry("incisions", { status: { Abdomen: { level: "Normal", symptoms: ["Redness", "Increased warmth"] } } })],
      null, null, DAY
    );
    expect(s.redness?.answer).toBe("yes");
  });

  it("stays quiet on a normal incision", () => {
    const s = suggestFlags([entry("incisions", { status: { Abdomen: { level: "Normal", symptoms: [] } } })], null, null, DAY);
    expect(s.redness).toBeUndefined();
  });

  it("treats pus or odour as drainage too", () => {
    const s = suggestFlags([entry("incisions", { status: { Abdomen: { level: "Normal", symptoms: ["Pus"] } } })], null, null, DAY);
    expect(s.drainage?.answer).toBe("yes");
  });
});

describe("drainage", () => {
  it("raises on a foul odour", () => {
    expect(suggestFlags([entry("drainage", { odor: "foul" })], null, null, DAY).drainage?.answer).toBe("yes");
  });

  it("raises bleeding on bright red, and says how much", () => {
    const s = suggestFlags([entry("drainage", { color: "Bright Red", amount: "soaked" })], null, null, DAY);
    expect(s.bleeding?.answer).toBe("yes");
    expect(s.bleeding.why).toContain("soaked");
  });
});

describe("the rest of the trackers", () => {
  it("raises dizziness from a movement entry", () => {
    expect(suggestFlags([entry("movement", { felt: ["steady", "dizzy"] })], null, null, DAY).dizzy?.answer).toBe("yes");
  });

  it("raises on dark urine but not on pale", () => {
    expect(suggestFlags([entry("urine", { color: "Brown / tea" })], null, null, DAY).urine?.answer).toBe("yes");
    expect(suggestFlags([entry("urine", { color: "Pale yellow" })], null, null, DAY).urine).toBeUndefined();
  });

  it("raises pain at 8 and not at 7", () => {
    expect(suggestFlags([entry("checkin", { pain: 8 })], null, null, DAY).pain?.answer).toBe("yes");
    expect(suggestFlags([entry("checkin", { pain: 7 })], null, null, DAY).pain).toBeUndefined();
  });

  it("takes the worst check-in of the day, not the last", () => {
    const s = suggestFlags([entry("checkin", { pain: 9 }), entry("checkin", { pain: 2 })], null, null, DAY);
    expect(s.pain?.answer).toBe("yes");
    expect(s.pain.why).toContain("9");
  });

  it("raises the garment flag on numbness under it", () => {
    const s = suggestFlags([entry("skin", { findings: { Abdomen: ["Numbness"] } })], null, null, DAY);
    expect(s.garment?.answer).toBe("yes");
  });

  it("raises the calf flag only for a calf", () => {
    expect(suggestFlags([entry("skin", { findings: { "Left calf": ["Bruising"] } })], null, null, DAY).calf?.answer).toBe("yes");
    expect(suggestFlags([entry("skin", { findings: { Abdomen: ["Bruising"] } })], null, null, DAY).calf).toBeUndefined();
  });
});

describe("bowel", () => {
  it("raises at three days", () => {
    const s = suggestFlags([], null, "2026-09-09", DAY);
    expect(s.bowel?.answer).toBe("yes");
    expect(s.bowel.why).toContain("2026-09-09");
  });

  it("stays quiet at two", () => {
    expect(suggestFlags([], null, "2026-09-10", DAY).bowel).toBeUndefined();
  });

  it("stays quiet when there was one today, however old the last record", () => {
    expect(suggestFlags([entry("bm", { bristol: 4 })], null, "2026-01-01", DAY).bowel).toBeUndefined();
  });
});

describe("what it will not do", () => {
  it("never answers no for her", () => {
    // The absence of an entry is not evidence that nothing is wrong.
    const s = suggestFlags(
      [entry("temp", { temp: 98.6 }), entry("urine", { color: "Pale yellow" }), entry("checkin", { pain: 1 })],
      null, null, DAY
    );
    expect(Object.values(s).every((v) => v.answer === "yes")).toBe(true);
  });

  it("never suggests the two it cannot see", () => {
    const s = suggestFlags([entry("temp", { temp: 104 }), entry("drainage", { odor: "foul" })], null, null, DAY);
    for (const key of UNTRACKED_FLAGS) expect(s[key]).toBeUndefined();
  });

  it("says nothing about an empty day", () => {
    expect(suggestFlags([], null, null, DAY)).toEqual({});
  });

  it("always says where a suggestion came from", () => {
    const s = suggestFlags(
      [entry("temp", { temp: 104 }), entry("drainage", { odor: "foul" }), entry("checkin", { pain: 10 })],
      null, null, DAY
    );
    expect(Object.keys(s).length).toBeGreaterThan(0);
    for (const v of Object.values(s)) expect(v.why).toBeTruthy();
  });
});
