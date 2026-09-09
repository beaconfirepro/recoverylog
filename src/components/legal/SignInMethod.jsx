import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

// Setting a password gives the account a way in that does not go through
// Google. It is sent as a reset link rather than typed here, because an
// account that has only ever used Google has no current password to check
// against, which is what changePassword asks for.
export default function SignInMethod() {
  const { user } = useAuth();
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const send = async () => {
    setState("sending");
    setError("");
    try {
      await base44.auth.resetPasswordRequest(user.email);
      setState("sent");
    } catch (e) {
      setError(e.message || "The email could not be sent. Try again in a moment.");
      setState("idle");
    }
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">How you sign in</div>
        <div className="text-sm font-semibold break-words">{user?.email}</div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold break-words">
          Set a password and you can sign in with your email instead of Continue with Google. We email you a link to
          choose it.
        </p>

        {state === "sent" ? (
          <p className="text-sm font-bold break-words">
            Sent. Open the link in your email to choose a password, then sign in with your email from now on.
          </p>
        ) : (
          <button
            className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2"
            onClick={send}
            disabled={state === "sending"}
          >
            <KeyRound className="w-4 h-4" />
            {state === "sending" ? "Sending…" : "Email me a password link"}
          </button>
        )}

        {error && <p className="text-sm font-semibold text-destructive break-words">{error}</p>}

        {/* Say what this does not do. A password is a second way in, not the
            removal of the first one, and pretending otherwise is worse than
            the gap itself. */}
        <p className="text-xs font-semibold text-muted-foreground break-words">
          Setting a password does not disconnect Google from this account. To do that, remove LipNode from your
          Google account at myaccount.google.com under Data and privacy, then sign in here with your email and password.
        </p>
      </div>
    </div>
  );
}
