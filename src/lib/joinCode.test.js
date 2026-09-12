import { describe, expect, it } from "vitest";
import {
  codeMatches, dobDigest, dobMatches, formatJoinCode, generateJoinCode, normalizeDob, normalizeJoinCode
} from "@/lib/joinCode";

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

describe("the date of birth factor", () => {
  const CODE = "7K2QM4";
  const DOB = "1974-03-09";

  const invite = async () => ({ join_code: CODE, dob_check: await dobDigest(CODE, DOB) });

  it("normalizes what a date input hands over", () => {
    expect(normalizeDob(" 1974-03-09 ")).toBe("1974-03-09");
    expect(normalizeDob("1974-03-09T00:00:00Z")).toBe("1974-03-09");
    expect(normalizeDob(null)).toBe("");
  });

  it("lets the right date through", async () => {
    expect(await dobMatches(await invite(), CODE, DOB)).toBe(true);
    expect(await dobMatches(await invite(), "7k2q-m4", DOB)).toBe(true);
  });

  it("keeps a wrong date out, including one day off", async () => {
    const row = await invite();
    expect(await dobMatches(row, CODE, "1974-03-08")).toBe(false);
    expect(await dobMatches(row, CODE, "1974-04-09")).toBe(false);
    expect(await dobMatches(row, CODE, "1975-03-09")).toBe(false);
  });

  it("refuses an empty date", async () => {
    const row = await invite();
    expect(await dobMatches(row, CODE, "")).toBe(false);
    expect(await dobMatches(row, CODE, null)).toBe(false);
  });

  it("will not verify a date against the wrong code", async () => {
    // The code is the salt, which is what stops either factor giving up the
    // other: the digest is worthless to someone who does not already have both.
    expect(await dobMatches(await invite(), "7K2QM5", DOB)).toBe(false);
  });

  it("produces nothing to compare when a factor is missing", async () => {
    expect(await dobDigest("", DOB)).toBe(null);
    expect(await dobDigest(CODE, "")).toBe(null);
    expect(await dobDigest("7K2QM", DOB)).toBe(null);
  });

  it("does not carry the date itself", async () => {
    // A digest that contained the date would defeat the point: an invitation
    // that reached the wrong address would leak the patient's date of birth.
    const row = await invite();
    expect(row.dob_check).not.toContain("1974");
    expect(row.dob_check).toMatch(/^[0-9a-f]{64}$/);
  });

  it("opens an invitation written before the date was asked for", async () => {
    // Those rows carry no digest. The code alone opened them, and refusing
    // them outright would lock out a care team that is already helping.
    expect(await dobMatches({ join_code: CODE }, CODE, "")).toBe(true);
  });
});
