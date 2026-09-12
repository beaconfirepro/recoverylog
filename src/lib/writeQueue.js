// Writes that failed because there was nothing to write to, held until there
// is.
//
// #90 made a failed save visible and offered Retry. That is the right thing to
// tell someone watching the screen, and a poor instruction to someone whose
// signal went ten minutes ago, so this keeps the write and sends it when the
// connection comes back.
//
// The whole difficulty is replay. She logs an entry, it fails, she gives up and
// types it in again later, and then the queue drains — and she has two. For a
// record handed to a surgeon a duplicated entry is worse than a missing one: a
// missing one is incomplete, a duplicate is wrong. So every queued create
// carries an id this device made before the row existed, and replay asks
// whether that id already landed before sending anything.

export const QUEUE_KEY = "recoverylog.writeQueue.v1";

// Past this, something is wrong that draining will not fix, and an unbounded
// queue in localStorage eventually cannot be written at all.
export const MAX_QUEUED = 50;

export const newClientId = () =>
  `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

// A queued write is data, never a closure: the point is to survive a reload,
// and a closure cannot.
export const makeItem = ({ entity, op, args, clientId, at }) => ({
  id: newClientId(),
  entity,
  op,
  args,
  clientId: clientId || null,
  at: at || Date.now()
});

export const isQueueable = (d) =>
  !!d && typeof d.entity === "string" && ["create", "update"].includes(d.op) && Array.isArray(d.args);

export const enqueue = (queue, item) => {
  const list = Array.isArray(queue) ? queue : [];
  // The same create queued twice is the same write twice. This is the first of
  // the two guards against duplicates; the one that matters is in replay,
  // because the duplicate that hurts is the one she typed herself.
  const already = item.clientId && list.some((q) => q.clientId === item.clientId && q.op === item.op);
  if (already) return list;
  // Oldest go first when the cap is hit: a write from six days ago is less
  // likely to still be wanted than the one she just made.
  return [...list, item].slice(-MAX_QUEUED);
};

export const remove = (queue, id) => (Array.isArray(queue) ? queue.filter((q) => q.id !== id) : []);

// Drains in order, oldest first, and stops at the first failure rather than
// hammering a connection that is still down. A write whose row is already there
// is dropped rather than sent: that is the whole reason clientId exists.
//
// `send` performs one write. `exists` answers whether a clientId already landed;
// it is asked only for creates, because an update is addressed by row id and
// replaying one is not a duplicate.
export const replay = async (queue, { send, exists }) => {
  const list = Array.isArray(queue) ? [...queue] : [];
  const done = [];
  const skipped = [];
  let rest = list;

  for (const item of list) {
    try {
      if (item.op === "create" && item.clientId && (await exists(item.entity, item.clientId))) {
        skipped.push(item.id);
        rest = remove(rest, item.id);
        continue;
      }
      await send(item);
      done.push(item.id);
      rest = remove(rest, item.id);
    } catch {
      // Still no connection, or this one write is broken. Either way, stop:
      // the rest are almost certainly going to fail the same way, and draining
      // a queue against a dead network is how you turn one failure into fifty.
      break;
    }
  }

  return { queue: rest, done, skipped };
};

/* ---------- storage ---------- */

export const readQueue = () => {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private window, blocked storage, or something else wrote nonsense here.
    // An empty queue is the honest answer: nothing is held.
    return [];
  }
};

export const writeQueue = (queue) => {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    // Out of room, or storage refused. The caller has already told her the
    // write failed; it simply will not be retried for her.
    return false;
  }
};
