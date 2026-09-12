import { describe, expect, it } from "vitest";
import { detailsMatch, maskedDob, maskedName } from "@/lib/invite";

const row = { match_first_name: "Deborah", match_last_name: "Dale", match_dob: "1974-03-02" };

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
});

describe("maskedDob", () => {
  it("shows only the last two digits of the year", () => {
    expect(maskedDob(row)).toBe("··/··/74");
  });

  it("never shows the day or the month", () => {
    expect(maskedDob(row)).not.toContain("03");
    expect(maskedDob(row)).not.toContain("02");
  });

  it("shows nothing without a date", () => {
    expect(maskedDob({})).toBe("");
    expect(maskedDob(null)).toBe("");
  });
});

describe("detailsMatch", () => {
  it("lets the right details in", () => {
    expect(detailsMatch(row, { first_name: "Deborah", last_name: "Dale", dob: "1974-03-02" })).toBe(true);
  });

  it("forgives case and stray spacing", () => {
    expect(detailsMatch(row, { first_name: " deborah ", last_name: "DALE", dob: "1974-03-02" })).toBe(true);
    expect(
      detailsMatch(
        { ...row, match_first_name: "Mary Jane" },
        { first_name: "mary   jane", last_name: "Dale", dob: "1974-03-02" }
      )
    ).toBe(true);
  });

  it("keeps the wrong details out", () => {
    expect(detailsMatch(row, { first_name: "Debora", last_name: "Dale", dob: "1974-03-02" })).toBe(false);
    expect(detailsMatch(row, { first_name: "Deborah", last_name: "Dales", dob: "1974-03-02" })).toBe(false);
    expect(detailsMatch(row, { first_name: "Deborah", last_name: "Dale", dob: "1974-03-03" })).toBe(false);
  });

  it("does not let an empty form through an empty invitation", () => {
    // Both blank must not read as a match, or a row with no details set would
    // open to anyone who submitted nothing.
    expect(detailsMatch({}, { first_name: "", last_name: "", dob: "" })).toBe(false);
  });
});
