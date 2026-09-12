// What a write says for itself: the words, and the decisions behind them.
//
// Until now not one write in the logging flow had a try/catch. A create that
// failed on recliner wifi — the exact conditions this app is used in — put the
// entry on screen, took it off again on the next reload, and said nothing; the
// patient's own recollection was the only record it had ever been typed.
//
// These live here rather than in saving.jsx next door because that file has to
// build a Retry button, which makes it a module no test can import without a
// DOM. The words and the reasoning are the parts worth testing, so they sit on
// this side of the line.

const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

// A short buzz when a save lands. iOS Safari — the platform this app is
// actually used on — has no navigator.vibrate at all, so this returns false
// there and nothing is built on top of it: the toast is the confirmation and
// the buzz is a bonus on Android. The try is for a browser that has the
// function and still refuses the call.
export function buzz(nav = typeof navigator === "undefined" ? null : navigator, ms = 10) {
  if (!nav || typeof nav.vibrate !== "function") return false;
  try {
    return nav.vibrate(ms) !== false;
  } catch {
    return false;
  }
}

// Why it failed, as far as we can honestly say. Offline is the common case and
// the one thing she can act on, so it is checked before anything the error
// itself claims.
export function failureReason(
  err,
  online = typeof navigator === "undefined" ? undefined : navigator.onLine
) {
  if (online === false) return "This device is offline.";
  // A message the app wrote for her, rather than one the network wrote for us.
  const written = typeof err?.userMessage === "string" ? err.userMessage.trim() : "";
  if (written) return sentence(written);
  // Register.jsx already shows err.message with a fallback behind it and that
  // is the right trade: a sentence from the backend beats "something went
  // wrong". The length and newline checks are what keep a stack trace out of a
  // toast.
  const raw = typeof err?.message === "string" ? err.message.trim() : "";
  if (raw && raw.length <= 120 && !raw.includes("\n")) return sentence(raw);
  return "The save didn't reach the server.";
}

export const savedNote = (what, saved) => ({
  title: "Saved",
  description: saved || `${what} is saved.`
});

export const deletedNote = (what, deleted) => ({
  title: "Deleted",
  description: deleted || `${what} is off this day.`
});

export function failedNote(what, err, { online, title, advice } = {}) {
  return {
    variant: "destructive",
    // An error the app wrote for her brings its own headline: a name that saved
    // on the log but not on the care team is not "didn't save", and must not
    // read as it.
    title: err?.userTitle || title || `${what} didn't save`,
    description: `${failureReason(err, online)} ${
      advice || "Nothing you typed is lost. Tap Retry to send it again."
    }`
  };
}

// The patient's name lives in two places: her own row, and a copy on every
// care team row so an unopened invitation can say who it is from. When some of
// those copies take and others do not, "Saved" is a lie and "didn't save" is
// one too, so the half-done case carries its own words.
export function teamCopyError(failed, total) {
  const err = new Error(
    `Your name is saved on your log, but ${failed} of ${total} care team ${
      total === 1 ? "row" : "rows"
    } still ${failed === 1 ? "shows" : "show"} the old one.`
  );
  err.userTitle = "Your care team kept the old name";
  err.userMessage = err.message;
  return err;
}
