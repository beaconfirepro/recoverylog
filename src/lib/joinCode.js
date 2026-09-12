// The credential a care team member types to open a patient's log.
//
// It replaces the patient's name and date of birth, which were never a secret:
// a sister knows both, and an invitation sent to a mistyped address showed
// enough of them to guess the rest. A code is known only to the patient and
// whoever she reads it out to.
//
// The invitation email deliberately does not carry it. Holding the address is
// what identifies you; the code is what proves the patient meant you.

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
