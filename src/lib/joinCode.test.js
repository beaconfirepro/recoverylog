import { describe, expect, it } from "vitest";
import { codeMatches, formatJoinCode, generateJoinCode, normalizeJoinCode } from "@/lib/joinCode";

// This is the whole of what stops an invitation landing at the wrong address
// from opening a patient's log, so the tests are about what it refuses.

describe("generateJoinCode", () => {
  it("is six characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i += 1) expect(generateJoinCode()).toMatch(/^[234679ACDEFGHJKMNPQRTUVWXYZ]{6}$/);
  });

  it("never uses a character that gets misread aloud", () => {
    // 0 and O, 1 and I and L, 5 and S, 8 and B.
    const codes = Array.from({ length: 300 }, generateJoinCode).join("");
    for (const bad of ["0", "O", "1", "I", "L", "5", "S", "8", "B"]) expect(codes).not.toContain(bad);
  });

  it("does not repeat itself", () => {
    const seen = new Set(Array.from({ length: 500 }, generateJoinCode));
    expect(seen.size).toBeGreaterThan(495);
  });
});

describe("normalizeJoinCode", () => {
  it("forgives how a person types", () => {
    expect(normalizeJoinCode(" 7k2q-m4 ")).toBe("7K2QM4");
    expect(normalizeJoinCode("7K2Q M4")).toBe("7K2QM4");
  });

  it("copes with nothing", () => {
    expect(normalizeJoinCode(null)).toBe("");
    expect(normalizeJoinCode(undefined)).toBe("");
  });
});

describe("codeMatches", () => {
  const row = { join_code: "7K2QM4" };

  it("lets the right code in, however it was typed", () => {
    expect(codeMatches(row, "7K2QM4")).toBe(true);
    expect(codeMatches(row, "7k2q-m4")).toBe(true);
    expect(codeMatches(row, " 7K2Q M4 ")).toBe(true);
  });

  it("keeps the wrong code out", () => {
    expect(codeMatches(row, "7K2QM5")).toBe(false);
    expect(codeMatches(row, "7K2QM")).toBe(false);
    expect(codeMatches(row, "7K2QM44")).toBe(false);
  });

  it("refuses an empty answer", () => {
    // The failure that matters: nothing typed must never open anything.
    expect(codeMatches(row, "")).toBe(false);
    expect(codeMatches(row, null)).toBe(false);
    expect(codeMatches(row, "   ")).toBe(false);
  });

  it("refuses an invitation that carries no code", () => {
    // Written before codes existed. It opens to nobody, not to everybody.
    expect(codeMatches({}, "")).toBe(false);
    expect(codeMatches({ join_code: "" }, "")).toBe(false);
    expect(codeMatches({ join_code: null }, "ANY")).toBe(false);
    expect(codeMatches(null, "")).toBe(false);
  });

  it("refuses a short code even if it is a prefix of the real one", () => {
    expect(codeMatches({ join_code: "7K2" }, "7K2")).toBe(false);
  });
});

describe("formatJoinCode", () => {
  it("breaks it where a person pauses", () => {
    expect(formatJoinCode("7K2QM4")).toBe("7K2-QM4");
  });

  it("leaves anything else alone rather than inventing a dash", () => {
    expect(formatJoinCode("")).toBe("");
    expect(formatJoinCode("7K2")).toBe("7K2");
  });
});
