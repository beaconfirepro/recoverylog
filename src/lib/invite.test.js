import { describe, expect, it } from "vitest";
import { maskedName } from "@/lib/invite";

const row = { match_first_name: "Deborah", match_last_name: "Dale" };

describe("maskedName", () => {
  it("shows an initial and the ends of the surname", () => {
    expect(maskedName(row)).toBe("D. D__e");
  });

  it("never prints a whole surname", () => {
    // The point of masking. A two-letter name is the case that slips through a
    // naive first-and-last-letter rule.
    for (const last of ["Ng", "Li", "Wu", "Dale", "Fitzgerald"]) {
      expect(maskedName({ ...row, match_last_name: last })).not.toContain(last);
    }
  });

  it("capitalises the initial whatever was typed", () => {
    expect(maskedName({ ...row, match_first_name: "deborah" })).toBe("D. D__e");
  });

  it("copes with a missing half", () => {
    expect(maskedName({ match_last_name: "Dale" })).toBe("D__e");
    expect(maskedName({ match_first_name: "Deborah" })).toBe("D.");
  });

  it("says something rather than nothing when the row is bare", () => {
    expect(maskedName({})).toBe("A patient");
    expect(maskedName(null)).toBe("A patient");
  });

  it("says nothing about a date of birth, which invitations no longer carry", () => {
    expect(maskedName({ ...row, match_dob: "1974-03-02" })).toBe("D. D__e");
  });
});
