// The two things a care team member types to open a patient's log: the
// six-character code the patient reads out, and the patient's date of birth.
//
// Neither is enough alone. The date of birth is not a secret — a sister knows
// it — so the code is what proves the patient meant you. The code alone can be
// overheard or forwarded, so the date of birth is what proves you are the
// person she meant to read it to.
//
// The invitation email deliberately carries neither. Holding the address is
// what identifies you; the other two are what let you in.

// No 0/O, 1/I/L, 5/S, 8/B. Someone is reading this over the phone or off a
// text message, and a code that has to be spelled out is a code that gets
// typed wrong.
const ALPHABET = "234679ACDEFGHJKMNPQRTUVWXYZ";
const LENGTH = 6;

export const generateJoinCode = () => {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);
  // Rejection would be tidier, but 256 % 27 skews the first four letters by
  // about four percent, which is nothing against a code you get one shot at.
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
};

// People type spaces, dashes and lower case. None of that should be a wrong
// code.
export const normalizeJoinCode = (v) =>
  String(v ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");

export const codeMatches = (row, typed) => {
  const stored = normalizeJoinCode(row?.join_code);
  // An invitation with no code on it is one written before codes existed. It
  // cannot be opened by typing nothing; the patient removes it and adds the
  // person again.
  if (stored.length !== LENGTH) return false;
  return stored === normalizeJoinCode(typed);
};

// Shown to the patient, and only to her: "7K2Q-M4" reads back over a phone
// better than six unbroken characters.
export const formatJoinCode = (code) => {
  const c = normalizeJoinCode(code);
  return c.length === LENGTH ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
};

// The date of birth is checked against a hash, not against a copy of the date.
// Row security lets an invited account read its own invitation, so a date
// sitting there in the clear would hand over the very thing it is meant to
// prove — and an invitation that reached the wrong address would leak the
// patient's date of birth to a stranger.
//
// The code is the salt. Without it the hash cannot be walked back through the
// forty thousand or so plausible dates, so one factor never gives up the other.
const encode = (s) => new TextEncoder().encode(s);
const hex = (buf) =>
  Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export const normalizeDob = (v) => String(v ?? "").trim().slice(0, 10);

export const dobDigest = async (joinCode, dob) => {
  const code = normalizeJoinCode(joinCode);
  const date = normalizeDob(dob);
  if (code.length !== LENGTH || !date) return null;
  return hex(await crypto.subtle.digest("SHA-256", encode(`${code}|${date}`)));
};

export const dobMatches = async (row, typedCode, typedDob) => {
  const stored = String(row?.dob_check ?? "");
  // An invitation written before the date of birth was asked for carries no
  // digest. The code alone opened it then, and the patient can reissue the
  // invitation to get both factors.
  if (!stored) return true;
  const digest = await dobDigest(typedCode, typedDob);
  return !!digest && digest === stored;
};
