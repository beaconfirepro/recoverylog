import { createClientFromRequest } from "npm:@base44/sdk";

// Which log an account can see is decided here, under the service role, and
// nowhere else.
//
// Two things set it: starting your own log, and opening an invitation with the
// join code the patient read out. Both used to happen in the browser, which
// meant the tenancy key and the credential that guards it were both writable
// by whoever held a console. Everything downstream rests on patient_id, so
// that was the whole security model in one editable field.
//
// Doing it here closes both. The join code is compared against a row the
// caller cannot read through this path, and patient_id is written by the
// service role rather than by updateMe.

const LENGTH = 6;

const normalize = (v: unknown) => String(v ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");

// Constant time, because the caller controls one side and can try again. Six
// characters is short enough that a timing difference is worth denying.
const codesMatch = (stored: string, typed: string) => {
  if (stored.length !== LENGTH || typed.length !== LENGTH) return false;
  let diff = 0;
  for (let i = 0; i < LENGTH; i += 1) diff |= stored.charCodeAt(i) ^ typed.charCodeAt(i);
  return diff === 0;
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const admin = base44.asServiceRole;
    const { action, join_code, patient_id, first_name, last_name, dob } = await req.json();

    // Everything is keyed off the caller's own login email, never off anything
    // the caller sent. There is no argument here that names another account.
    const mine =
      (await admin.entities.AppUser.filter({ email: String(user.email).trim().toLowerCase() }, "created_date", 50)) ||
      [];

    if (action === "start") {
      if (mine.some((r: { kind?: string }) => r.kind === "patient")) {
        return Response.json({ error: "This account already has a log." }, { status: 409 });
      }
      const row = await admin.entities.AppUser.create({
        email: String(user.email).trim().toLowerCase(),
        kind: "patient",
        first_name: String(first_name ?? "").trim(),
        last_name: String(last_name ?? "").trim(),
        dob: dob || null
      });
      // A patient row points at itself, and the id does not exist until the row
      // does.
      await admin.entities.AppUser.update(row.id, { patient_id: row.id });
      // The patient is the only account that ever carries a write claim.
      await admin.entities.User.update(user.id, { patient_id: row.id, write_patient_id: row.id });
      return Response.json({ ok: true, patient_id: row.id });
    }

    if (action === "claim") {
      const typed = normalize(join_code);
      // The row is found by the caller's own email, so a wrong code cannot be
      // aimed at someone else's invitation.
      const invite = mine.find(
        (r: { kind?: string; join_code?: string; patient_id?: string }) =>
          r.kind === "team_member" && r.patient_id && codesMatch(normalize(r.join_code), typed)
      );
      // Deliberately the same message whether the invitation is missing, has no
      // code, or the code is wrong. Telling them which would say whether an
      // invitation exists for an address.
      if (!invite) return Response.json({ error: "That code does not match an invitation." }, { status: 403 });

      if (!invite.claimed_at) {
        await admin.entities.AppUser.update(invite.id, { claimed_at: new Date().toISOString() });
      }
      // Read only. A care team member never carries a write claim, so there is
      // no path through this function that grants one to anyone but the patient.
      await admin.entities.User.update(user.id, { patient_id: invite.patient_id, write_patient_id: null });
      return Response.json({ ok: true, patient_id: invite.patient_id });
    }

    if (action === "switch") {
      // Someone on more than one care team choosing which log to look at. It
      // can only land on a group they have already opened.
      const row = mine.find(
        (r: { patient_id?: string; claimed_at?: string; kind?: string }) =>
          r.patient_id === String(patient_id ?? "") && (r.kind === "patient" || r.claimed_at)
      );
      if (!row) return Response.json({ error: "You do not have access to that log." }, { status: 403 });
      await admin.entities.User.update(user.id, {
        patient_id: row.patient_id,
        write_patient_id: row.kind === "patient" ? row.patient_id : null
      });
      return Response.json({ ok: true, patient_id: row.patient_id });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
