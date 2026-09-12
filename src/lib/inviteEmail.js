import { base44 } from "@/api/base44Client";

// What an invited person receives. Base44 sends it; there is no mail provider
// to configure and no key to hold.
//
// Neither of the two things that open the log is in here. The address is what
// says who you are; the code says the patient meant you, and her date of birth
// says you are the person she meant to read it to. Putting any of that in the
// same message makes it one secret rather than three, and a single mistyped
// letter then hands over the whole thing. She passes both on herself.

export const inviteBody = ({ memberFirstName, patientName, appUrl }) => {
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

export const inviteSubject = (patientName) => `${patientName} added you to their recovery log`;

export const sendInviteEmail = async ({ to, memberFirstName, patientName, appUrl }) =>
  base44.integrations.Core.SendEmail({
    to,
    subject: inviteSubject(patientName),
    body: inviteBody({ memberFirstName, patientName, appUrl }),
    from_name: "LipNode"
  });
