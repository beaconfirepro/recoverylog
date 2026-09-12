import { describe, expect, it } from "vitest";
import { composeTime, digits, parseTime } from "@/lib/clock";

describe("parseTime", () => {
  it("reads afternoon times as PM", () => {
    expect(parseTime("13:05")).toEqual({ h: "1", m: "05", pm: true });
    expect(parseTime("23:59")).toEqual({ h: "11", m: "59", pm: true });
  });

  it("reads morning times as AM", () => {
    expect(parseTime("07:00")).toEqual({ h: "7", m: "00", pm: false });
    expect(parseTime("11:30")).toEqual({ h: "11", m: "30", pm: false });
  });

  it("gets midnight and noon right", () => {
    // The pair that catches naive modulo arithmetic: both would read as hour 0.
    expect(parseTime("00:00")).toEqual({ h: "12", m: "00", pm: false });
    expect(parseTime("00:30")).toEqual({ h: "12", m: "30", pm: false });
    expect(parseTime("12:00")).toEqual({ h: "12", m: "00", pm: true });
    expect(parseTime("12:45")).toEqual({ h: "12", m: "45", pm: true });
  });

  it("comes back empty rather than guessing", () => {
    expect(parseTime("")).toEqual({ h: "", m: "", pm: false });
    expect(parseTime(null)).toEqual({ h: "", m: "", pm: false });
    expect(parseTime("not a time")).toEqual({ h: "", m: "", pm: false });
  });
});

describe("composeTime", () => {
  it("writes 24-hour times", () => {
    expect(composeTime("1", "05", true)).toBe("13:05");
    expect(composeTime("7", "00", false)).toBe("07:00");
    expect(composeTime("11", "59", true)).toBe("23:59");
  });

  it("gets midnight and noon right", () => {
    expect(composeTime("12", "00", false)).toBe("00:00");
    expect(composeTime("12", "00", true)).toBe("12:00");
  });

  it("pads a single digit", () => {
    expect(composeTime("9", "5", false)).toBe("09:05");
  });

  it("writes nothing from an incomplete time", () => {
    expect(composeTime("", "30", false)).toBe("");
    expect(composeTime("9", "", false)).toBe("");
  });
});

describe("round trip", () => {
  it("survives every minute of the day", () => {
    for (let H = 0; H < 24; H += 1) {
      for (const M of [0, 1, 29, 30, 59]) {
        const t = `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
        const p = parseTime(t);
        expect(composeTime(p.h, p.m, p.pm)).toBe(t);
      }
    }
  });
});

describe("digits", () => {
  it("keeps only numbers, up to the width", () => {
    expect(digits("1a2b3", 2)).toBe("12");
    expect(digits("07", 2)).toBe("07");
    expect(digits("abc", 2)).toBe("");
  });
});
