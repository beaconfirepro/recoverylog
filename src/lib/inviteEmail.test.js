import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/base44Client", () => ({ base44: { integrations: { Core: { SendEmail: vi.fn() } } } }));

const { inviteBody, inviteSubject } = await import("@/lib/inviteEmail");

const args = { memberFirstName: "Jane", patientName: "Deborah", appUrl: "https://lipnode.app" };

describe("the invitation", () => {
  it("says who added them and what they will see", () => {
    const body = inviteBody(args);
    expect(body).toContain("Hi Jane,");
    expect(body).toContain("Deborah has added you");
    expect(inviteSubject("Deborah")).toBe("Deborah added you to their recovery log");
  });

  it("never carries the join code", () => {
    // The whole point. An address and a code in one message is one secret, not
    // two, and a mistyped address then hands over both.
    const body = inviteBody({ ...args, joinCode: "7K2QM4" });
    expect(body).not.toContain("7K2QM4");
    expect(body).toContain("Ask them for it");
  });

  it("is plain about read access, because that is the promise", () => {
    expect(inviteBody(args)).toContain("You cannot change anything");
  });

  it("greets someone whose name was not given", () => {
    expect(inviteBody({ ...args, memberFirstName: "" })).toContain("Hi,");
  });
});
