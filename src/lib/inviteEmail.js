import { base44 } from "@/api/base44Client";

// What an invited person receives. Base44 sends it; there is no mail provider
// to configure and no key to hold.
//
// The join code is deliberately absent. The address is what says who you are;
// the code is what says the patient meant you, and putting both in one message
// means a single mistyped letter hands over the whole thing. The patient reads
// the code out.

export const inviteBody = ({ memberFirstName, patientName, appUrl }) => {
  const hello = memberFirstName ? `Hi ${memberFirstName},` : "Hi,";
  return `${hello}

${patientName} has added you to the care team on their recovery log.

You will be able to see how their recovery is going day to day: their check-ins, how they are healing, and anything their surgeon should know. You cannot change anything, and they can remove you at any time.

To open it:

1. Go to ${appUrl}
2. Sign in with this email address
3. Enter the join code ${patientName} gives you

The code is not in this email on purpose. Ask them for it.

If you were not expecting this, you can ignore it. Nothing opens until someone enters the code.`;
};

export const inviteSubject = (patientName) => `${patientName} added you to their recovery log`;

export const sendInviteEmail = async ({ to, memberFirstName, patientName, appUrl }) =>
  base44.integrations.Core.SendEmail({
    to,
    subject: inviteSubject(patientName),
    body: inviteBody({ memberFirstName, patientName, appUrl }),
    from_name: "LipNode"
  });
