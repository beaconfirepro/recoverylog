// Writes the queue is still holding, described well enough to put on screen.
//
// #123 made a failed write survive; it did not make it visible. The toast said
// the entry would send itself and then the day showed nothing, because nothing
// was written — so the one instruction someone who does not trust that gets is
// to type it again. The duplicate is caught by client_id, but she spends the
// day believing she logged it twice.
//
// Only creates are described. An update is an edit to a row that is already on
// the screen: the old values show until the new ones land, which is honest, and
// a second copy of that row would not be.
//
// Nothing here turns a queued item into an entry. It is deliberately a
// different shape from a row, so that it cannot be sorted into the feed, summed
// into the day's totals, or reach the PDF — none of which it belongs in, for
// the same reason: it is not in the record yet.

export const pendingCreates = (queue, entity, matches) =>
  (Array.isArray(queue) ? queue : [])
    .filter((q) => q?.op === "create" && q.entity === entity && q.args?.[0])
    .map((q) => ({ key: q.id, at: q.at, row: q.args[0] }))
    .filter((p) => (matches ? matches(p.row) : true))
    .sort((a, b) => a.at - b.at);

// A queued entry for one day of one log. surgeryIds is what the day is already
// showing — in multi-record mode that is more than one — so a held entry does
// not surface on a day it was not logged against.
export const pendingEntriesFor = (queue, { date, surgeryIds }) => {
  const ids = Array.isArray(surgeryIds) ? surgeryIds : [surgeryIds];
  return pendingCreates(queue, "RecoveryEntry", (row) => row.date === date && ids.includes(row.surgery_id));
};
