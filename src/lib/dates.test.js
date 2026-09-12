/* global process */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDays,
  dateRange,
  dateStr,
  daysBetween,
  isDayStr,
  MAX_RANGE_DAYS,
  monthKey,
  monthLabel,
  parseDate,
  postOpLabel
} from "@/lib/dates";

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

describe("addDays", () => {
  it("walks a day in each direction", () => {
    expect(addDays("2026-09-12", -1)).toBe("2026-09-11");
    expect(addDays("2026-09-12", 1)).toBe("2026-09-13");
    expect(addDays("2026-09-12", 0)).toBe("2026-09-12");
  });

  it("rolls over a month and a year boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-02-01", -1)).toBe("2026-01-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("finds the leap day, and skips it when there is none", () => {
    // The prev/next arrows walk one day at a time, so 29 February is a day she
    // can land on and has to be able to log.
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("crosses a daylight saving change without repeating or losing a day", () => {
    // US clocks go back on 1 November 2026. A 23 or 25 hour day would land the
    // arrows on the day they started from if the step were 86400000 milliseconds.
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
});

describe("date arithmetic west of UTC", () => {
  // The tests otherwise run pinned to UTC, where parsing a date string as UTC
  // midnight happens to give the right day and hides the bug. The whole app is
  // used in a western timezone, so the arithmetic is run in one here.
  const tz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/Los_Angeles";
  });
  afterAll(() => {
    process.env.TZ = tz;
  });

  it("stays on the day it was asked for", () => {
    expect(dateStr(parseDate("2026-09-12"))).toBe("2026-09-12");
    expect(addDays("2026-09-12", -1)).toBe("2026-09-11");
    expect(addDays("2026-09-12", 1)).toBe("2026-09-13");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("still reads a date string as local, not UTC", () => {
    expect(parseDate("2026-09-12").getDate()).toBe(12);
  });
});

describe("isDayStr", () => {
  it("accepts a date the app wrote", () => {
    expect(isDayStr("2026-09-12")).toBe(true);
    expect(isDayStr("2028-02-29")).toBe(true);
  });

  it("refuses a day that does not exist", () => {
    // A date input can be typed into rather than picked, and /day/:date is a
    // URL. parseDate rolls both of these forward into the next month, and the
    // day page would create a row for a date nobody can ever reach again.
    expect(isDayStr("2026-02-30")).toBe(false);
    expect(isDayStr("2027-02-29")).toBe(false);
    expect(isDayStr("2026-13-01")).toBe(false);
  });

  it("refuses anything that is not a date at all", () => {
    expect(isDayStr("")).toBe(false);
    expect(isDayStr(null)).toBe(false);
    expect(isDayStr("2026-9-12")).toBe(false);
    expect(isDayStr("today")).toBe(false);
    expect(isDayStr("2026-09-12T00:00:00Z")).toBe(false);
  });
});

describe("month grouping", () => {
  it("keys a date by its month, sorting with the dates it groups", () => {
    expect(monthKey("2026-09-12")).toBe("2026-09");
    expect(monthKey("2026-09-01")).toBe(monthKey("2026-09-30"));
    expect(monthKey("2026-08-31") < monthKey("2026-09-01")).toBe(true);
  });

  it("labels the month with its year, so two Septembers are told apart", () => {
    expect(monthLabel("2026-09-12")).toContain("2026");
    expect(monthLabel("2026-09-12")).not.toBe(monthLabel("2027-09-12"));
  });
});