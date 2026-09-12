import { describe, expect, it } from "vitest";
import { digitsOf, telHref } from "@/lib/phone";

// This is the link a frightened patient taps at 3am. What matters is that it
// dials the right number, and that it is absent rather than broken when there
// is no number to dial.

describe("telHref", () => {
  it("dials a number typed the way a discharge sheet writes it", () => {
    expect(telHref("(555) 123-4567")).toBe("tel:5551234567");
    expect(telHref("555.123.4567")).toBe("tel:5551234567");
    expect(telHref("555 123 4567")).toBe("tel:5551234567");
    expect(telHref(" 5551234567 ")).toBe("tel:5551234567");
  });

  it("keeps a country code where one was given", () => {
    expect(telHref("+1 555 123 4567")).toBe("tel:+15551234567");
    expect(telHref("+44 20 7946 0958")).toBe("tel:+442079460958");
  });

  it("keeps the characters a switchboard needs", () => {
    expect(telHref("555-123-4567,,2")).toBe("tel:5551234567,,2");
    expect(telHref("555-123-4567;ext=9")).toBe("tel:5551234567;9");
    expect(telHref("555-123-4567 #2")).toBe("tel:5551234567#2");
  });

  it("drops a + that is not a country code", () => {
    // Somebody's formatting, not a dialling instruction. A tel: with a stray +
    // in the middle is refused by some diallers outright.
    expect(telHref("555+123+4567")).toBe("tel:5551234567");
  });

  it("offers nothing rather than something broken", () => {
    // The failure that matters: a half-typed number must not render a button
    // that dials somewhere else.
    expect(telHref("555-123")).toBe(null);
    expect(telHref("call the office")).toBe(null);
    expect(telHref("")).toBe(null);
    expect(telHref(null)).toBe(null);
    expect(telHref(undefined)).toBe(null);
    expect(telHref("   ")).toBe(null);
  });

  it("accepts a bare ten-digit number, which is the shortest real one", () => {
    expect(telHref("5551234567")).toBe("tel:5551234567");
    expect(telHref("555123456")).toBe(null);
  });
});

describe("digitsOf", () => {
  it("counts only the digits", () => {
    expect(digitsOf("(555) 123-4567")).toBe("5551234567");
    expect(digitsOf("+1 555 123 4567")).toBe("15551234567");
    expect(digitsOf(null)).toBe("");
  });
});
