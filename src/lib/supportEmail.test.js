import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/base44Client", () => ({ base44: { integrations: { Core: { SendEmail: vi.fn() } } } }));

const { supportBody, supportSubject, SUPPORT_TO } = await import("@/lib/supportEmail");

const args = {
  name: "Deborah Dale",
  email: "deb@example.com",
  role: "patient",
  build: "a1b2c3d",
  message: "  The PDF stops at day 40.  "
};

describe("a support message", () => {
  it("leads with what she wrote", () => {
    expect(supportBody(args).startsWith("The PDF stops at day 40.")).toBe(true);
  });

  it("carries what she should not have to type", () => {
    // The build and the role are the two things she would get wrong, and the
    // same bug looks different from a patient and from a care team member.
    const body = supportBody(args);
    expect(body).toContain("deb@example.com");
    expect(body).toContain("Using: patient");
    expect(body).toContain("Build: a1b2c3d");
  });

  it("says so rather than leaving a blank", () => {
    const body = supportBody({ ...args, name: "", build: "" });
    expect(body).toContain("no name given");
    expect(body).toContain("Build: unknown");
  });

  it("copes with an empty message", () => {
    expect(() => supportBody({ ...args, message: undefined })).not.toThrow();
  });

  it("says which side it came from in the subject", () => {
    expect(supportSubject("patient")).toBe("LipNode: message from a patient");
    expect(supportSubject("care team member")).toBe("LipNode: message from a care team member");
  });

  it("goes to one address, which is not in the app's copy", () => {
    expect(SUPPORT_TO).toBe("info@pearshapedapps.com");
  });
});
