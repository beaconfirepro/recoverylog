// Turning a typed phone number into something a phone will dial.
//
// The number is free text — "(555) 123-4567", "555.123.4567 ext 2", "+1 555
// 123 4567" — because that is how a discharge sheet writes it and retyping it
// into a strict field is one more thing to get wrong while sore. tel: wants the
// digits.

// Everything a dialler understands: digits, a leading +, and the pause and
// extension characters that a switchboard number needs. Letters and brackets go.
const DIALLABLE = /[^0-9+,;#*]/g;

// Ten digits is the shortest real number this app will see (a US number without
// the country code). Below that it is a fragment someone stopped typing, and
// offering to dial it is worse than offering nothing.
const MIN_DIGITS = 10;

export const digitsOf = (raw) => String(raw ?? "").replace(/\D/g, "");

export const telHref = (raw) => {
  const s = String(raw ?? "").trim();
  if (digitsOf(s).length < MIN_DIGITS) return null;
  // A + is only meaningful at the front. One that turns up mid-number came from
  // someone's formatting, not from a country code.
  const cleaned = (s.startsWith("+") ? "+" : "") + s.replace(DIALLABLE, "").replace(/\+/g, "");
  return cleaned ? `tel:${cleaned}` : null;
};
