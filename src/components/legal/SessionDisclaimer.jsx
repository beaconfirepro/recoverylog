import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

// Shown once per sign-in, not once per version. The consent gate records which
// documents you agreed to and when; this is a reminder of what the log is and
// is not, and it wants saying every time rather than filing away.
const KEY = "recoverylog.disclaimerSeen";

const seen = () => {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    // A browser refusing storage shows it once per navigation, which errs the
    // right way for a safety notice.
    return false;
  }
};

const markSeen = () => {
  try {
    window.sessionStorage.setItem(KEY, "1");
  } catch {
    // Nothing to do. The notice simply appears again.
  }
};

export default function SessionDisclaimer({ children }) {
  const { logout } = useAuth();
  const [done, setDone] = useState(seen);

  if (done) return children;

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" aria-hidden="true" /> Before you go in
          </div>
          <div className="text-sm font-semibold break-words">What this log is, and what it is not.</div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold break-words">
            <strong>This is not a medical record.</strong> Nothing you write here is sent to your surgeon or
            added to their notes. They will not see it unless you show them.
          </p>
          <p className="text-sm font-semibold break-words">
            <strong>It can be shared.</strong> Anyone you add to your care team can read the whole log, and a
            PDF you export goes wherever you send it.
          </p>
          <p className="text-sm font-semibold break-words">
            <strong>It is not a substitute for talking to your surgeon.</strong> If something worries you, call
            the office. If it is an emergency, call emergency services.
          </p>
          <p className="text-sm font-semibold break-words">
            Everything here is for your own information.
          </p>

          <button
            type="button"
            className="nb-btn w-full h-14 bg-primary text-primary-foreground"
            onClick={() => {
              markSeen();
              setDone(true);
            }}
          >
            I understand
          </button>
          <button type="button" className="nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
