/* global __BUILD_COMMIT__ */
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Send, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName } from "@/lib/PatientContext";
import { sendSupportEmail } from "@/lib/supportEmail";

// A health log with no route to a person is a support problem waiting for its
// first frightened user. A form rather than a listed address, so nobody has to
// leave the app, open mail, and describe where they were.
//
// What it carries without her typing it is the point: which build she is on and
// whether she is the patient or reading someone else's log. She would get both
// wrong, and the same bug looks different from those two sides.
export default function ContactForm() {
  const { user } = useAuth();
  const { me, patient, isOwner } = usePatient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState(null); // "sending" | "sent" | "failed"

  const role = isOwner ? "patient" : "care team member";
  const name = displayName(isOwner ? patient : me) || "";

  const send = async () => {
    setState("sending");
    try {
      await sendSupportEmail({
        name,
        email: user?.email,
        role,
        build: typeof __BUILD_COMMIT__ === "string" ? __BUILD_COMMIT__ : "",
        message
      });
      setState("sent");
      setMessage("");
    } catch {
      setState("failed");
    }
  };

  const close = () => {
    setOpen(false);
    setMessage("");
    setState(null);
  };

  return (
    <div className="nb-card overflow-hidden">
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl uppercase leading-tight break-words">Contact us</div>
            <div className="text-sm font-semibold break-words">
              Something wrong, or something missing. A person reads these.
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </div>
      </button>

      {/* Portalled out of the card for the same reason HelpSection is: main is
          its own stacking context, so a z-50 child of it still paints under the
          z-30 bars. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto" style={{ paddingTop: "var(--safe-t)" }}>
          <div className="max-w-lg mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
              <div className="min-w-0">
                <div className="font-display text-xl uppercase leading-tight break-words">Contact us</div>
                <div className="text-sm font-semibold break-words">
                  Something wrong, or something missing. A person reads these.
                </div>
              </div>
              <button type="button" onClick={close} className="nb-btn h-11 w-11 shrink-0 bg-card" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Said plainly, because a message about a medical log should not be a
                  guess about what got attached to it. */}
              <p className="text-xs font-semibold text-muted-foreground break-words">
                Sent with your name, the address you signed in with, and which version of the app you are on. Nothing
                from your log goes with it.
              </p>

              <textarea
                className="nb-textarea min-h-[6rem]"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (state) setState(null);
                }}
                placeholder="What happened, and what you expected instead."
                aria-label="Your message"
              />

              <button
                type="button"
                className="nb-btn w-full h-12 bg-primary text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40"
                onClick={send}
                disabled={state === "sending" || !message.trim()}
              >
                <Send className="w-4 h-4 shrink-0" />
                {state === "sending" ? "Sending…" : "Send"}
              </button>

              {state === "sent" && (
                <p className="text-sm font-bold break-words" role="status">
                  Sent. Someone will read it and reply to {user?.email}.
                </p>
              )}
              {state === "failed" && (
                <p className="text-sm font-bold text-destructive break-words" role="status">
                  That did not send. What you wrote is still here — check your connection and tap Send again.
                </p>
              )}
            </div>

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