import { describe, expect, it } from "vitest";
import { isOffline } from "@/lib/offline";

// navigator.onLine is a low bar: it says the device has a network interface,
// not that anything is reachable. So it is only ever used to explain a failure
// that already happened — never to decide whether to try — and the test that
// matters is that an unknown state is not treated as offline.

describe("isOffline", () => {
  it("is offline only when the browser says so outright", () => {
    expect(isOffline({ onLine: false })).toBe(true);
  });

  it("is not offline when connected", () => {
    expect(isOffline({ onLine: true })).toBe(false);
  });

  it("does not guess when the browser will not say", () => {
    // The failure that would matter: telling a patient nothing will save,
    // on a connection that is fine, because a property was missing.
    expect(isOffline({})).toBe(false);
    expect(isOffline(undefined)).toBe(false);
    expect(isOffline(null)).toBe(false);
  });
})
