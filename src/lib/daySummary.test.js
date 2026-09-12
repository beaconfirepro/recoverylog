import { describe, expect, it } from "vitest";
import { computeTotals, sortEntries, timeToMin } from "@/lib/daySummary";

// These numbers go on the day page, into the goals, and into the PDF a surgeon
// reads. A wrong total is a wrong record.

const at = (time, type, data) => ({ entry_time: time, type, data });
const PAST = "2026-09-01"; // never today, so open-ended spans close at midnight

describe("timeToMin", () => {
  it("counts from midnight", () => {
    expect(timeToMin("00:00")).toBe(0);
    expect(timeToMin("09:30")).toBe(570);
    expect(timeToMin("23:59")).toBe(1439);
  });
});

describe("sortEntries", () => {
  it("puts the day in time order", () => {
    const out = sortEntries([at("14:00", "water", {}), at("07:00", "water", {}), at("21:30", "water", {})]);
    expect(out.map((e) => e.entry_time)).toEqual(["07:00", "14:00", "21:30"]);
  });
});

describe("water and protein", () => {
  it("adds up the day", () => {
    const t = computeTotals(
      [at("08:00", "water", { ounces: 12 }), at("12:00", "water", { ounces: 8 }), at("18:00", "water", { ounces: 20 })],
      PAST
    );
    expect(t.water).toBe(40);
  });

  it("reads protein out of the nutrients entry", () => {
    const t = computeTotals([at("08:00", "nutrients", { nutrients: { Protein: 30, Carbs: 40 } })], PAST);
    expect(t.protein).toBe(30);
  });

  it("counts a missing or unreadable figure as nothing, not NaN", () => {
    const t = computeTotals([at("08:00", "water", {}), at("09:00", "water", { ounces: "" }), at("10:00", "water", { ounces: 10 })], PAST);
    expect(t.water).toBe(10);
  });

  it("is zero on an empty day", () => {
    const t = computeTotals([], PAST);
    expect(t.water).toBe(0);
    expect(t.protein).toBe(0);
  });
});

describe("compression hours", () => {
  it("measures an on to off span", () => {
    const t = computeTotals([at("08:00", "compression", { action: "on" }), at("12:00", "compression", { action: "off" })], PAST);
    expect(t.garmentMin).toBe(240);
  });

  it("adds two spans in the same day", () => {
    const t = computeTotals(
      [
        at("08:00", "compression", { action: "on" }),
        at("10:00", "compression", { action: "off" }),
        at("14:00", "compression", { action: "on" }),
        at("15:30", "compression", { action: "off" })
      ],
      PAST
    );
    expect(t.garmentMin).toBe(210);
  });

  it("runs an unclosed span to midnight on a past day", () => {
    const t = computeTotals([at("22:00", "compression", { action: "on" })], PAST);
    expect(t.garmentMin).toBe(119); // 22:00 to 23:59
  });

  it("ignores an off with no on before it", () => {
    expect(computeTotals([at("12:00", "compression", { action: "off" })], PAST).garmentMin).toBe(0);
  });

  it("does not double-count a second on", () => {
    const t = computeTotals(
      [at("08:00", "compression", { action: "on" }), at("09:00", "compression", { action: "on" }), at("10:00", "compression", { action: "off" })],
      PAST
    );
    expect(t.garmentMin).toBe(120);
  });
});

describe("movement", () => {
  it("counts entries rather than minutes", () => {
    const t = computeTotals([at("09:00", "movement", { minutes: 10 }), at("15:00", "movement", { minutes: 20 })], PAST);
    expect(t.walks).toBe(2);
  });
});

describe("temperature", () => {
  it("keeps morning and evening apart", () => {
    const t = computeTotals([at("07:00", "temp", { temp: 98.4 }), at("19:00", "temp", { temp: 100.1 })], PAST);
    expect(t.tempAm).toBe(98.4);
    expect(t.tempPm).toBe(100.1);
  });
});
