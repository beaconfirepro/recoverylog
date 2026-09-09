import React from "react";
import { AlertTriangle } from "lucide-react";

// Shown when the platform will not serve this account at all. There is no
// administrator to write to, so it names the two things that actually help.
export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-lg w-full nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" /> We can't open this account
          </div>
          <div className="text-sm font-semibold break-words">
            This email isn't on a log yet.
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold break-words">
            Start your own log, or ask the patient to add this email to their care team. If you have more
            than one email, check you signed in with the one they used.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="nb-btn w-full h-14 bg-primary text-primary-foreground"
          >
            Sign in with another email
          </button>
        </div>
      </div>
    </div>
  );
}
