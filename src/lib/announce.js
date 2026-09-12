// The app saying out loud what it just did.
//
// There was one live region in the whole tree, in PullToRefresh, and it was
// empty except while a refresh was in flight. A screen reader user got no word
// of a save, a failure, a deletion, or — the one that is a safety matter
// rather than a politeness — a switch to somebody else's medical record.
//
// A module rather than a context: every write in the app has to be able to
// reach it, and the regions themselves belong in Layout, which is mounted once
// above all of them.

// A live region is only announced when its text changes. Two identical
// messages in a row — two entries saved the same way — would be a change to
// nothing and stay silent, so the repeat gets an invisible space on the end.
export const distinct = (previous, message) =>
  previous === message ? `${message} ` : message;

const lanes = { polite: "", assertive: "" };
const listeners = new Set();

export function announce(message, { assertive = false } = {}) {
  const text = String(message ?? "").trim();
  if (!text) return;
  const lane = assertive ? "assertive" : "polite";
  lanes[lane] = distinct(lanes[lane], text);
  const snapshot = { ...lanes };
  listeners.forEach((listener) => listener(snapshot));
}

// Assertive interrupts whatever is being read. Reserved for the log switch:
// whose medical record is on screen is not something to hear after the fact.
export const announceNow = (message) => announce(message, { assertive: true });

export const currentAnnouncements = () => ({ ...lanes });

export function subscribeAnnouncements(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
