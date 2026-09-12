import React, { useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

// A general help page answers questions people go looking for. The two
// questions this app actually generates arrive at a specific moment on a
// specific screen: what is this code, and what is a red flag. This is the mark
// that answers them where they are asked.
//
// A popover rather than a hover tooltip, because the primary device has no
// hover — a title attribute here would be invisible to everyone who matters.
export default function HelpHint({ label, children, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* The glyph is small; the target is not. 44pt is the minimum anywhere
          in this app and a help mark is no exception. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`What is ${label}?`}
        className={`inline-grid place-items-center w-11 h-11 -m-3 shrink-0 text-muted-foreground ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 px-3 pb-3"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label={label}
            className="nb-card w-full max-w-lg p-4 space-y-3"
            style={{ marginBottom: "var(--safe-b)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <h2 className="font-heading text-sm uppercase tracking-wider break-words">{label}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="nb-btn h-9 w-9 shrink-0 bg-card p-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm font-medium leading-relaxed break-words space-y-2">{children}</div>

            <Link to="/me" className="nb-btn w-full h-11 bg-card" onClick={() => setOpen(false)}>
              Read more in Help &amp; FAQ
            </Link>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
