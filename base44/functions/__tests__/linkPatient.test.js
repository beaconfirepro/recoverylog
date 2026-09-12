import { beforeEach, describe, expect, it } from "vitest";
import { setBackend, table } from "./fakeBase44.js";
import linkPatient from "../linkPatient/entry.ts";

// This function decides which log an account can see. Everything else in the
// app trusts patient_id, so a mistake here is not a bug in one screen, it is
// one patient reading another patient's recovery.

const req = (body) => new Request("https://x/linkPatient", { method: "POST", body: JSON.stringify(body) });
const call = async (body) => {
  const res = await linkPatient(req(body));
  return [res.status, await res.json()];
};

// Fresh objects every time. The function writes to the login row, so a shared
// literal would carry one test's patient_id into the next.
const JANE = () => ({ id: "u_jane", email: "jane@example.com" });
const NEW = () => ({ id: "u_new", email: "new@example.com" });
const login = (id) => table("User").find((r) => r.id === id);

// Jane holds an open invitation to Deb's log and an opened one to Ann's.
const world = () => ({
  AppUser: [
    { id: "p_deb", email: "deb@example.com", kind: "patient", patient_id: "p_deb" },
    { id: "p_ann", email: "ann@example.com", kind: "patient", patient_id: "p_ann" },
    { id: "m_deb", email: "jane@example.com", kind: "team_member", patient_id: "p_deb", join_code: "7K2QM4" },
    { id: "m_ann", email: "jane@example.com", kind: "team_member", patient_id: "p_ann", join_code: "XYZ234", claimed_at: "2026-09-01T00:00:00Z" },
    // Someone else's invitation, with a code Jane could learn.
    { id: "m_other", email: "bob@example.com", kind: "team_member", patient_id: "p_ann", join_code: "AAAA22" }
  ],
  User: [JANE(), NEW(), { id: "u_bob", email: "bob@example.com" }]
});

describe("claiming an invitation", () => {
  beforeEach(() => setBackend({ me: JANE(), tables: world() }));

  it("opens the log on the right code", async () => {
    const [status, out] = await call({ action: "claim", join_code: "7K2QM4" });
    expect(status).toBe(200);
    expect(out.patient_id).toBe("p_deb");
    expect(login("u_jane").patient_id).toBe("p_deb");
  });

  it("forgives the spacing and case a person types", async () => {
    expect((await call({ action: "claim", join_code: " 7k2q-m4 " }))[0]).toBe(200);
  });

  it("never hands out a write claim", async () => {
    // The whole read-only promise. A care team member writes nothing.
    await call({ action: "claim", join_code: "7K2QM4" });
    expect(login("u_jane").write_patient_id).toBeNull();
  });

  it("marks when it was opened, and does not move that date on a second visit", async () => {
    await call({ action: "claim", join_code: "XYZ234" });
    expect(table("AppUser").find((r) => r.id === "m_ann").claimed_at).toBe("2026-09-01T00:00:00Z");
  });

  it("refuses a wrong code and links nothing", async () => {
    const [status, out] = await call({ action: "claim", join_code: "7K2QM5" });
    expect(status).toBe(403);
    expect(out.error).toBe("That code does not match an invitation.");
    expect(login("u_jane").patient_id).toBeUndefined();
  });

  it("refuses an empty code", async () => {
    // The failure that matters: nothing typed must never open anything.
    expect((await call({ action: "claim", join_code: "" }))[0]).toBe(403);
    expect((await call({ action: "claim" }))[0]).toBe(403);
    expect(login("u_jane").patient_id).toBeUndefined();
  });

  it("cannot be aimed at someone else's invitation", async () => {
    // Jane knows Bob's code. It is not addressed to her, so it opens nothing:
    // the row is found by her own login email, never by the code alone.
    const [status] = await call({ action: "claim", join_code: "AAAA22" });
    expect(status).toBe(403);
    expect(login("u_jane").patient_id).toBeUndefined();
  });

  it("refuses an invitation written before codes existed", async () => {
    setBackend({
      me: JANE(),
      tables: {
        ...world(),
        AppUser: [{ id: "m_old", email: "jane@example.com", kind: "team_member", patient_id: "p_deb" }]
      }
    });
    expect((await call({ action: "claim", join_code: "" }))[0]).toBe(403);
    expect((await call({ action: "claim", join_code: "ANYTHI" }))[0]).toBe(403);
  });

  it("says the same thing however it failed", async () => {
    // Different messages would tell a stranger whether an invitation exists for
    // an address.
    const wrong = (await call({ action: "claim", join_code: "ZZZZ22" }))[1].error;
    setBackend({ me: NEW(), tables: world() });
    const none = (await call({ action: "claim", join_code: "7K2QM4" }))[1].error;
    expect(none).toBe(wrong);
  });
});

describe("starting your own log", () => {
  beforeEach(() => setBackend({ me: NEW(), tables: world() }));

  it("creates a row that points at itself and takes the write claim", async () => {
    const [status, out] = await call({ action: "start", first_name: "Nell", last_name: "Vance", dob: "1980-04-02" });
    expect(status).toBe(200);
    const row = table("AppUser").find((r) => r.id === out.patient_id);
    expect(row.patient_id).toBe(row.id);
    expect(row.kind).toBe("patient");
    expect(login("u_new").write_patient_id).toBe(row.id);
  });

  it("stores the email the way an invitation stores it, so the two compare", async () => {
    setBackend({ me: { id: "u_caps", email: "  Nell@Example.COM " }, tables: { ...world(), User: [{ id: "u_caps", email: "  Nell@Example.COM " }] } });
    const [, out] = await call({ action: "start", first_name: "Nell", last_name: "Vance" });
    expect(table("AppUser").find((r) => r.id === out.patient_id).email).toBe("nell@example.com");
  });

  it("refuses a second log on the same account", async () => {
    await call({ action: "start", first_name: "Nell", last_name: "Vance" });
    const [status] = await call({ action: "start", first_name: "Nell", last_name: "Vance" });
    expect(status).toBe(409);
  });

  it("does not stop a care team member starting their own", async () => {
    // Jane helps Deb and then has surgery herself. Those are different things.
    setBackend({ me: JANE(), tables: world() });
    expect((await call({ action: "start", first_name: "Jane", last_name: "Ito" }))[0]).toBe(200);
  });
});

describe("switching between logs", () => {
  beforeEach(() => setBackend({ me: JANE(), tables: world() }));

  it("moves to a log already opened", async () => {
    const [status] = await call({ action: "switch", patient_id: "p_ann" });
    expect(status).toBe(200);
    expect(login("u_jane").patient_id).toBe("p_ann");
    expect(login("u_jane").write_patient_id).toBeNull();
  });

  it("refuses a log whose invitation is still unopened", async () => {
    // Deb's invitation exists but the code has never been entered. Switching
    // must not be a way round it.
    const [status] = await call({ action: "switch", patient_id: "p_deb" });
    expect(status).toBe(403);
    expect(login("u_jane").patient_id).toBeUndefined();
  });

  it("refuses a log she has nothing to do with", async () => {
    expect((await call({ action: "switch", patient_id: "p_nobody" }))[0]).toBe(403);
    expect((await call({ action: "switch" }))[0]).toBe(403);
  });
});

describe("the edges", () => {
  it("refuses when signed out", async () => {
    setBackend({ me: null, tables: world() });
    expect((await call({ action: "claim", join_code: "7K2QM4" }))[0]).toBe(401);
  });

  it("refuses an action it does not know", async () => {
    setBackend({ me: JANE(), tables: world() });
    expect((await call({ action: "grant" }))[0]).toBe(400);
    expect((await call({}))[0]).toBe(400);
  });
});
