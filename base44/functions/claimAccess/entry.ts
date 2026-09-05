import { createClientFromRequest } from "npm:@base44/sdk";

// Joining a care team is checked here rather than in the browser, because the
// browser cannot do it: row security stops an unlinked account from reading the
// patient's row, and putting the answer on the joiner's own row would let them
// read it straight back. Service role can see both sides; the caller sees only
// whether it matched.

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const { first_name, last_name, dob } = await req.json();
    if (!norm(first_name) || !norm(last_name) || !dob) {
      return Response.json(
        { error: "Patient first name, last name and date of birth are all needed." },
        { status: 400 }
      );
    }

    const admin = base44.asServiceRole;

    // The invitation, written by the patient. Without one there is nothing to
    // join, whatever the caller types.
    const invites = await admin.entities.AppUser.filter(
      { email: user.email, kind: "team_member" },
      "created_date",
      5
    );
    const invite = invites.find((i: { patient_id?: string }) => i.patient_id);
    if (!invite) {
      return Response.json(
        { error: "This account has not been added to a care team." },
        { status: 403 }
      );
    }

    const patient = await admin.entities.AppUser.get(invite.patient_id);
    if (!patient || patient.kind !== "patient") {
      return Response.json({ error: "That care team is no longer set up." }, { status: 409 });
    }

    const matches =
      norm(patient.first_name) === norm(first_name) &&
      norm(patient.last_name) === norm(last_name) &&
      String(patient.dob ?? "") === String(dob);

    // One message for any mismatch: saying which field was wrong would let a
    // caller narrow down the patient's details one at a time.
    if (!matches) {
      return Response.json({ error: "Those patient details do not match." }, { status: 403 });
    }

    await admin.entities.User.update(user.id, { patient_id: invite.patient_id });

    return Response.json({ ok: true, patient_id: invite.patient_id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
