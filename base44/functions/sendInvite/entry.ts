import { createClientFromRequest } from "npm:@base44/sdk";

// The invitation email. The browser used to send it directly, which the
// platform refuses: SendEmail is a Core method that only runs here, under the
// service role. So the send moved server-side, and the body is built here too —
// the caller passes who it is for, not what it says, so a patient cannot put
// words in the platform's mouth or point the send at someone the UI never
// offered.
//
// The body is mirrored from src/lib/inviteEmail.js, whose copy is the one the
// test pins. Keep them together when you change the wording.

const inviteSubject = (patientName: string) =>
  `${patientName} added you to their recovery log`;

const inviteBody = ({
  memberFirstName,
  patientName,
  appUrl
}: {
  memberFirstName: string;
  patientName: string;
  appUrl: string;
}) => {
  const hello = memberFirstName ? `Hi ${memberFirstName},` : "Hi,";
  return `${hello}

${patientName} has added you to the care team on their recovery log.

You will be able to see how their recovery is going day to day: their check-ins, how they are healing, and anything their surgeon should know. You cannot change anything, and they can remove you at any time.

To open it:

1. Go to ${appUrl}
2. Sign in with this email address
3. Enter the six-character code ${patientName} reads out to you, and their date of birth

Neither of those is in this email, on purpose. Ask them for both.

If you were not expecting this, you can ignore it. Nothing opens without the code and the date of birth.`;
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const { to, memberFirstName, patientName } = await req.json();
    const email = String(to || "").trim().toLowerCase();
    if (!isEmail(email)) {
      return Response.json({ error: "A valid email is needed." }, { status: 400 });
    }

    // Only a patient sends invitations. The UI already hides the button from
    // anyone else; this stops a direct call from a non-patient.
    const mine =
      (await base44.entities.AppUser.filter(
        { email: String(user.email).trim().toLowerCase() },
        "created_date",
        50
      )) || [];
    if (!mine.some((r: { kind?: string }) => r.kind === "patient")) {
      return Response.json({ error: "Only a patient can send invitations." }, { status: 403 });
    }

    const host =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || "recoverylog.base44.app";
    const appUrl = `https://${host}`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: inviteSubject(String(patientName || "A patient")),
      body: inviteBody({
        memberFirstName: String(memberFirstName || ""),
        patientName: String(patientName || "A patient"),
        appUrl
      }),
      from_name: "LipNode"
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}