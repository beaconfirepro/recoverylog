import { createClientFromRequest } from "npm:@base44/sdk";

// Deleting an account has to happen here rather than in the browser, for two
// reasons. Row security lets an account delete its own rows but not the login
// itself, and a patient's log is spread across six tables plus the rows her
// care team created, which she can read but not necessarily delete.
//
// The caller proves intent by sending back their own email. Nothing is deleted
// on a mistyped confirmation, and nothing here can delete anyone else: every
// query is scoped to the caller's own id or their own patient group.

const PATIENT_OWNED = ["RecoveryEntry", "RecoveryDay", "Surgery", "MeasurementSpot", "Garment", "MedGroup"];
const PAGE = 500;

const same = (a: unknown, b: unknown) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

// filter() returns a page at a time, so a long recovery needs more than one
// pass. Deleting as we go means the next page is always the remaining rows.
async function purge(admin: any, entity: string, query: Record<string, unknown>) {
  let removed = 0;
  for (;;) {
    const rows = await admin.entities[entity].filter(query, "created_date", PAGE);
    if (!rows?.length) return removed;
    for (const row of rows) await admin.entities[entity].delete(row.id);
    removed += rows.length;
    if (rows.length < PAGE) return removed;
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const { confirm_email } = await req.json();
    if (!same(confirm_email, user.email)) {
      return Response.json({ error: "That is not the email on this account." }, { status: 400 });
    }

    const admin = base44.asServiceRole;
    const deleted: Record<string, number> = {};

    // The caller's row in the app's people table tells us whether she is the
    // patient — and so owns a whole log — or a care-team member who owns none
    // of it and is only leaving.
    const mine = (await admin.entities.AppUser.filter({ email: user.email }, "created_date", 20)) || [];
    const patientRow = mine.find((r: { kind?: string }) => r.kind === "patient");
    const patientId = patientRow?.id || user.patient_id || null;

    if (patientRow && patientId) {
      for (const entity of PATIENT_OWNED) {
        deleted[entity] = await purge(admin, entity, { patient_id: patientId });
      }
      // Her care team's rows go with the log they were for; those people keep
      // their own logins and simply lose access to hers.
      deleted.AppUser = await purge(admin, "AppUser", { patient_id: patientId });
    }

    for (const row of mine) {
      await admin.entities.AppUser.delete(row.id);
      deleted.AppUser = (deleted.AppUser || 0) + 1;
    }

    // The login last: everything it pointed at is already gone, so a failure
    // here leaves an empty account rather than orphaned medical records.
    await admin.entities.User.delete(user.id);

    return Response.json({ ok: true, deleted });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
