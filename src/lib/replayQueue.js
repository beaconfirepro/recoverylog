import { base44 } from "@/api/base44Client";
import { announce } from "@/lib/announce";
import { isQueueable, makeItem, enqueue, readQueue, replay, writeQueue } from "@/lib/writeQueue";

// The queue's one connection to the outside: how a held write is sent, and how
// it asks whether the row already landed.
//
// exists() is the guard that stops a duplicate. It has to be able to fail —
// asking needs a connection too — and when it does, the write is held rather
// than sent, because "I could not check" must never be read as "it is not
// there".
const io = {
  send: async ({ entity, op, args }) => base44.entities[entity][op](...args),
  exists: async (entity, clientId) => {
    const rows = await base44.entities[entity].filter({ client_id: clientId }, "created_date", 1);
    return (Array.isArray(rows) ? rows : rows?.items || []).length > 0;
  }
};

// Put a failed write by for later. Called from the save wrapper, so nothing has
// to remember to do it.
export const hold = (descriptor) => {
  if (!isQueueable(descriptor)) return false;
  const next = enqueue(readQueue(), makeItem(descriptor));
  return writeQueue(next);
};

export const queuedCount = () => readQueue().length;

let running = false;

export const drain = async () => {
  // One drain at a time. Two overlapping ones would each read the same queue
  // and send everything twice, which is the exact thing this file exists to
  // prevent.
  if (running) return { done: [], skipped: [] };
  const queue = readQueue();
  if (!queue.length) return { done: [], skipped: [] };
  running = true;
  try {
    const out = await replay(queue, io);
    writeQueue(out.queue);
    if (out.done.length) {
      announce(
        out.done.length === 1
          ? "One entry you logged offline has now saved."
          : `${out.done.length} entries you logged offline have now saved.`
      );
    }
    return out;
  } finally {
    running = false;
  }
};

// Drained when the connection comes back, and once at startup — because the
// connection may have come back while the app was closed, which is the common
// case rather than the exotic one.
export const watchForConnection = () => {
  window.addEventListener("online", () => {
    drain();
  });
  drain();
};
