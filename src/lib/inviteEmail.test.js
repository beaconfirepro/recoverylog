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

  it("never carries either of the two things that open the log", () => {
    // The whole point. An address and a credential in one message is one
    // secret rather than two, and a mistyped address then hands over both.
    // Now three: the date of birth is the second factor and must not travel
    // here either.
    const body = inviteBody({ ...args, joinCode: "7K2QM4", dob: "1974-03-09" });
    expect(body).not.toContain("7K2QM4");
    expect(body).not.toContain("1974");
    expect(body).toContain("Ask them for both");
  });

  it("says the date of birth is needed, so the next screen is not a surprise", () => {
    // Somebody told only about a code, who then meets a form asking for two
    // things, concludes she has been sent the wrong invitation.
    expect(inviteBody(args)).toContain("date of birth");
  });

  it("is plain about read access, because that is the promise", () => {
    expect(inviteBody(args)).toContain("You cannot change anything");
  });

  it("greets someone whose name was not given", () => {
    expect(inviteBody({ ...args, memberFirstName: "" })).toContain("Hi,");
  });
});
