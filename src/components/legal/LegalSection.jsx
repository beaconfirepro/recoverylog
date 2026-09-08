import React, { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useLegal } from "@/lib/legal";
import DocReader from "./DocReader";

// accepted_at is a full timestamp rather than a date, so Date parses it
// without the timezone shift that catches date-only strings.
const agreedOn = (iso) => new Date(iso).toLocaleDateString();

// The documents, and the record of what this account agreed to. Read at any
// time from Profile, which is what "stored in settings" has to mean for a
// thing you agreed to once at the door.
export default function LegalSection() {
  const { docs, error, acceptedVersion } = useLegal();
  const [open, setOpen] = useState(null);
  const doc = docs.find((d) => d.kind === open);

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">Privacy and permissions</div>
        <div className="text-sm font-semibold break-words">What you agreed to, and when.</div>
      </div>

      <div className="p-4 space-y-2">
        {error && <p className="text-sm font-semibold text-destructive break-words">{error}</p>}

        {docs.map((d) => {
          const mine = acceptedVersion(d.kind);
          return (
            <button
              key={d.kind}
              type="button"
              onClick={() => setOpen(d.kind)}
              className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
            >
              <span className="flex-1 min-w-0">
                <span className="block nb-label truncate">{d.title}</span>
                <span className="block text-xs font-semibold text-muted-foreground break-words">
                  {mine ? `Agreed ${agreedOn(mine.accepted_at)}, version ${mine.version}` : "Not agreed yet"}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          );
        })}
      </div>

      {doc && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
              <div className="min-w-0">
                <div className="font-display text-xl uppercase leading-tight break-words">{doc.title}</div>
                <div className="text-sm font-semibold break-words">Version {doc.version}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="nb-btn h-11 w-11 shrink-0 bg-card"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <DocReader body={doc.body} />
          </div>
        </div>
      )}
    </div>
  );
}
