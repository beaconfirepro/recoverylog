import React, { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { TYPES } from "@/lib/recovery";
import { pendingEntriesFor } from "@/lib/pending";
import { readQueue } from "@/lib/writeQueue";
import { QUEUE_EVENT } from "@/lib/replayQueue";

// What the queue is still holding for this day, said on the day it belongs to.
//
// It sits beside the feed rather than in it, and that is the whole design. A
// held write has no row and no id: sorted into the feed it would be summed into
// the day's totals and tapped open into an editor for a row that does not
// exist, and the only honest place for it is next to the record rather than in
// it. It is not in the log until it sends.
//
// Not styled as a failure. Nothing has gone wrong — the entry is kept and it
// will send itself. What she needs to know is that it is not lost, which is the
// opposite of an error.
export default function PendingEntries({ date, surgeryIds }) {
  const [queue, setQueue] = useState(readQueue);

  useEffect(() => {
    const sync = () => setQueue(readQueue());
    window.addEventListener(QUEUE_EVENT, sync);
    // Another tab draining the queue is the same news as this one draining it.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(QUEUE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const held = pendingEntriesFor(queue, { date, surgeryIds });
  if (!held.length) return null;

  return (
    <div className="nb-card p-3 space-y-1.5">
      <p className="flex items-center gap-1.5 font-heading text-2xs uppercase tracking-wide text-muted-foreground">
        <CloudOff className="w-3.5 h-3.5 shrink-0" />
        {held.length === 1 ? "1 entry waiting to send" : `${held.length} entries waiting to send`}
      </p>
      <ul className="space-y-1">
        {held.map((p) => (
          <li key={p.key} className="text-sm font-semibold break-words">
            {TYPES[p.row.type]?.label || p.row.type}
          </li>
        ))}
      </ul>
      <p className="text-xs font-semibold text-muted-foreground break-words">
        Kept on this device and sent when you are back online. It is not in the log, or in a PDF you export,
        until it sends.
      </p>
    </div>
  );
}
