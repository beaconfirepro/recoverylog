// Keeping a tab's place across a switch away and back.
//
// The old version restored synchronously on the pathname change, which is the
// one moment it cannot work: the destination is still showing its spinner, so
// the document is one viewport tall, the browser clamps the scroll to roughly
// zero, and the list then renders underneath a position that has already been
// thrown away. It has never worked, on any tab, including plain tab switching.
//
// So the restore has to wait until the page is tall enough to hold the position
// it is being asked for. That is the whole of the logic here; Layout supplies
// the measurements and the observer that re-tries.

// The furthest down a document of this height can actually be scrolled. Past
// this the browser clamps, and a clamped restore is a lost position rather
// than a near miss.
export const maxScroll = (docHeight, viewport) => Math.max(0, docHeight - viewport);

export const canRestore = (target, docHeight, viewport) => target <= maxScroll(docHeight, viewport);

// How long to keep waiting for content before giving up and leaving the page at
// the top. A read that is still going after this is a read that has gone wrong,
// and scrolling a half-drawn page is worse than not scrolling it.
export const RESTORE_TIMEOUT_MS = 4000;

// Below this, restoring is not worth a jump: she is at or near the top already,
// which is where a fresh page starts anyway.
export const MIN_RESTORE = 24;

export const worthRestoring = (y) => typeof y === "number" && y >= MIN_RESTORE;
