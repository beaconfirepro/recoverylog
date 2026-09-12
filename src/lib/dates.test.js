import { describe, expect, it } from "vitest";
import { dateRange, daysBetween, MAX_RANGE_DAYS, parseDate, postOpLabel } from "@/lib/dates";

describe("parseDate", () => {
  it("reads a date as local, not UTC", () => {
    // "2026-09-05" parsed by Date() is midnight UTC, which is the day before in
    // any western timezone. Every day label in the app counts off this.
    const d = parseDate("2026-09-05");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(5);
  });
});

describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween("2026-09-05", "2026-09-12")).toBe(7);
    expect(daysBetween("2026-09-05", "2026-09-05")).toBe(0);
    expect(daysBetween("2026-09-12", "2026-09-05")).toBe(-7);
  });

  it("survives a daylight saving change", () => {
    // US clocks go back on 1 November 2026. A 23 or 25 hour day must not
    // round to the wrong number of days.
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });

  it("counts across a month and a year boundary", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2); // leap year
  });
});

describe("postOpLabel", () => {
  it("names the day of surgery, not day zero", () => {
    expect(postOpLabel("2026-09-05", "2026-09-05")).toBe("Day of Surgery");
  });

  it("counts forward", () => {
    expect(postOpLabel("2026-09-05", "2026-09-06")).toBe("Post-op day 1");
    expect(postOpLabel("2026-09-05", "2026-09-19")).toBe("Post-op day 14");
  });

  it("counts backward, and gets the singular right", () => {
    expect(postOpLabel("2026-09-05", "2026-09-04")).toBe("Pre-op · 1 day to go");
    expect(postOpLabel("2026-09-05", "2026-09-01")).toBe("Pre-op · 4 days to go");
  });

  it("says nothing without a surgery date", () => {
    expect(postOpLabel(null, "2026-09-05")).toBeNull();
    expect(postOpLabel("", "2026-09-05")).toBeNull();
  });
});

describe("dateRange", () => {
  it("includes both ends", () => {
    expect(dateRange("2026-09-05", "2026-09-08")).toEqual([
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08"
    ]);
  });

  it("returns the single day when from and to are the same", () => {
    expect(dateRange("2026-09-05", "2026-09-05")).toEqual(["2026-09-05"]);
  });

  it("returns nothing when to is before from", () => {
    expect(dateRange("2026-09-08", "2026-09-05")).toEqual([]);
  });

  it("stops at the cap rather than running away", () => {
    // The export refuses a range this wide rather than silently dropping days
    // out of a record meant for a surgeon. This is the backstop.
    const out = dateRange("2026-01-01", "2026-12-31");
    expect(out).toHaveLength(MAX_RANGE_DAYS);
  });

  it("crosses a month boundary without repeating or skipping", () => {
    const out = dateRange("2026-01-30", "2026-02-02");
    expect(out).toEqual(["2026-01-30", "2026-01-31", "2026-02-01", "2026-02-02"]);
    expect(new Set(out).size).toBe(out.length);
  });
});
