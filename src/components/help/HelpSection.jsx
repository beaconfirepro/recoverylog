import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, LifeBuoy, X } from "lucide-react";
import { useHelp } from "@/lib/help";
import { usePatient } from "@/lib/PatientContext";
import DocReader from "@/components/legal/DocReader";

// The app had no help surface at all: no FAQ, no explanation of the join code,
// no definition of a red flag, and no way to reach a person. Every question a
// user had, she had to ask the patient — or, if she was the patient, nobody.
export default function HelpSection() {
  const { docs, error } = useHelp();
  const { isOwner } = usePatient();
  const [open, setOpen] = useState(null);

  const shown = docs.find((d) => d.kind === open);
  const close = () => setOpen(null);

  // Hers first if she is the patient, theirs first if she is not. Both are
  // always listed: a patient with a care team gets asked these questions and
  // should be able to read the answers she is giving.
  const ordered = isOwner ? docs : [...docs].reverse();

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <LifeBuoy className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Help &amp; FAQ</div>
          <div className="text-sm font-semibold break-words">How the app works, and what to do when it does not.</div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {error && <p className="text-sm font-semibold text-destructive break-words">{error}</p>}
        {!error && docs.length === 0 && (
          <p className="text-sm text-muted-foreground break-words">Help is not available right now.</p>
        )}

        {ordered.map((d) => (
          <button
            key={d.kind}
            type="button"
            onClick={() => setOpen(d.kind)}
            className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
          >
            <span className="flex-1 min-w-0">
              <span className="block nb-label truncate">{d.title}</span>
              <span className="block text-xs font-semibold text-muted-foreground break-words">{d.summary}</span>
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" />
          </button>
        ))}
      </div>

      {/* Portalled out of the card for the same reason LegalSection is: main is
          its own stacking context, so a z-50 child of it still paints under the
          z-30 bars. */}
      {shown && createPortal(
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto" style={{ paddingTop: "var(--safe-t)" }}>
          <div className="max-w-lg mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
              <div className="min-w-0">
                <div className="font-display text-xl uppercase leading-tight break-words">{shown.title}</div>
                <div className="text-sm font-semibold break-words">{shown.summary}</div>
              </div>
              <button type="button" onClick={close} className="nb-btn h-11 w-11 shrink-0 bg-card" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DocReader body={shown.body} />
            <button type="button" onClick={close} className="nb-btn w-full h-12 bg-card mt-4">
              Done
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
