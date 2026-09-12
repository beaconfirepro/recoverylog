import { beforeEach, describe, expect, it } from "vitest";
import { deletions, setBackend, table } from "./fakeBase44.js";
import deleteAccount from "../deleteAccount/entry.ts";

// This function cannot be undone and it deletes medical records. It has never
// run in production, so these tests are the only thing standing between it and
// the first person who presses the button.

const req = (body) => new Request("https://x/deleteAccount", { method: "POST", body: JSON.stringify(body) });

const DEB = { id: "u_deb", email: "deb@example.com" };
const JANE = { id: "u_jane", email: "jane@example.com" };

// One patient with a real log, one care team member on it, and a second
// unrelated patient who must come through all of this untouched.
const world = () => ({
  AppUser: [
    { id: "p_deb", email: "deb@example.com", kind: "patient", patient_id: "p_deb" },
    { id: "m_jane", email: "jane@example.com", kind: "team_member", patient_id: "p_deb" },
    { id: "p_other", email: "other@example.com", kind: "patient", patient_id: "p_other" }
  ],
  RecoveryEntry: [
    ...Array.from({ length: 7 }, (_, i) => ({ id: `e${i}`, patient_id: "p_deb" })),
    { id: "e_other", patient_id: "p_other" }
  ],
  RecoveryDay: [{ id: "d1", patient_id: "p_deb" }, { id: "d_other", patient_id: "p_other" }],
  Surgery: [{ id: "s1", patient_id: "p_deb" }],
  MeasurementSpot: [{ id: "ms1", patient_id: "p_deb" }],
  Garment: [{ id: "g1", patient_id: "p_deb" }],
  MedGroup: [{ id: "mg1", patient_id: "p_deb" }],
  User: [DEB, JANE, { id: "u_other", email: "other@example.com" }]
});

const body = async (res) => [res.status, await res.json()];

describe("the confirmation", () => {
  beforeEach(() => setBackend({ me: DEB, tables: world() }));

  it("deletes nothing on a mistyped email", async () => {
    const [status, out] = await body(await deleteAccount(req({ confirm_email: "deb@exampl.com" })));
    expect(status).toBe(400);
    expect(out.error).toMatch(/not the email/i);
    expect(deletions()).toEqual([]);
  });

  it("deletes nothing when the email is someone else's", async () => {
    // The failure that would matter most: naming another account in the body.
    const [status] = await body(await deleteAccount(req({ confirm_email: "other@example.com" })));
    expect(status).toBe(400);
    expect(table("User")).toHaveLength(3);
    expect(deletions()).toEqual([]);
  });

  it("deletes nothing on an empty or missing confirmation", async () => {
    expect((await deleteAccount(req({ confirm_email: "" }))).status).toBe(400);
    expect((await deleteAccount(req({}))).status).toBe(400);
    expect(deletions()).toEqual([]);
  });

  it("forgives case and stray spacing, which is how a person types", async () => {
    const [status] = await body(await deleteAccount(req({ confirm_email: "  DEB@Example.com " })));
    expect(status).toBe(200);
  });
});

describe("signed out", () => {
  it("refuses without deleting", async () => {
    setBackend({ me: null, tables: world() });
    const [status] = await body(await deleteAccount(req({ confirm_email: "deb@example.com" })));
    expect(status).toBe(401);
    expect(deletions()).toEqual([]);
  });
});

describe("a patient deleting her own log", () => {
  beforeEach(() => setBackend({ me: DEB, tables: world() }));

  it("clears every table she owns", async () => {
    const [status, out] = await body(await deleteAccount(req({ confirm_email: "deb@example.com" })));
    expect(status).toBe(200);
    expect(out.ok).toBe(true);
    for (const t of ["RecoveryEntry", "RecoveryDay", "Surgery", "MeasurementSpot", "Garment", "MedGroup"]) {
      expect(table(t).filter((r) => r.patient_id === "p_deb"), t).toHaveLength(0);
    }
  });

  it("pages past the first page rather than stopping at it", async () => {
    // filter() returns at most one page, so a long recovery needs more than one
    // pass. 1201 entries against a 500-row page is three full pages and a short
    // one; a loop that ran once would leave 701 behind and report success.
    setBackend({
      me: DEB,
      tables: {
        ...world(),
        RecoveryEntry: Array.from({ length: 1201 }, (_, i) => ({ id: `e${i}`, patient_id: "p_deb" }))
      }
    });
    const [status, out] = await body(await deleteAccount(req({ confirm_email: "deb@example.com" })));
    expect(status).toBe(200);
    expect(out.deleted.RecoveryEntry).toBe(1201);
    expect(table("RecoveryEntry")).toHaveLength(0);
  });

  it("leaves another patient's log completely alone", async () => {
    await deleteAccount(req({ confirm_email: "deb@example.com" }));
    expect(table("RecoveryEntry").map((r) => r.id)).toEqual(["e_other"]);
    expect(table("RecoveryDay").map((r) => r.id)).toEqual(["d_other"]);
    expect(table("AppUser").map((r) => r.id)).toEqual(["p_other"]);
  });

  it("takes her care team's rows with the log they were for", async () => {
    await deleteAccount(req({ confirm_email: "deb@example.com" }));
    expect(table("AppUser").find((r) => r.id === "m_jane")).toBeUndefined();
  });

  it("leaves the care team member's own login standing", async () => {
    // Jane loses access to Deb's log. She does not lose her account.
    await deleteAccount(req({ confirm_email: "deb@example.com" }));
    expect(table("User").map((r) => r.id)).toContain("u_jane");
  });

  it("deletes the login last, so a failure leaves an empty account not orphaned records", async () => {
    await deleteAccount(req({ confirm_email: "deb@example.com" }));
    const log = deletions();
    expect(log[log.length - 1]).toBe("User:u_deb");
    expect(log.filter((l) => l.startsWith("User:"))).toHaveLength(1);
  });
});

describe("a care team member leaving", () => {
  beforeEach(() => setBackend({ me: JANE, tables: world() }));

  it("does not touch the patient's log", async () => {
    // Jane's own row carries patient_id p_deb. Reading that as "the log to
    // purge" would delete a patient's records because a helper left.
    const [status] = await body(await deleteAccount(req({ confirm_email: "jane@example.com" })));
    expect(status).toBe(200);
    expect(table("RecoveryEntry").filter((r) => r.patient_id === "p_deb")).toHaveLength(7);
    expect(table("AppUser").find((r) => r.id === "p_deb")).toBeDefined();
  });

  it("removes her own membership row and her login", async () => {
    await deleteAccount(req({ confirm_email: "jane@example.com" }));
    expect(table("AppUser").find((r) => r.id === "m_jane")).toBeUndefined();
    expect(table("User").find((r) => r.id === "u_jane")).toBeUndefined();
  });
});
