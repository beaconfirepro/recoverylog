import { base44 } from "@/api/base44Client";

// Where a message from the Contact us form goes. Listed here rather than in a
// document, because the decision was that no email address appears in the app:
// a person writes into a box and the app addresses it.
export const SUPPORT_TO = "info@pearshapedapps.com";

// What she would otherwise be asked to type, and would get wrong: which build
// she is on, and whether she is the patient or reading someone else's log. The
// same bug looks different from those two sides.
export const supportBody = ({ name, email, role, build, message }) =>
  `${String(message ?? "").trim()}

---
From: ${name || "no name given"} <${email}>
Using: ${role}
Build: ${build || "unknown"}`;

export const supportSubject = (role) => `LipNode: message from a ${role}`;

export const sendSupportEmail = async (fields) =>
  base44.integrations.Core.SendEmail({
    to: SUPPORT_TO,
    subject: supportSubject(fields.role),
    body: supportBody(fields),
    from_name: "LipNode"
  });
