import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import Field from "@/components/Field";

// Deleting an account is a thing you must be able to do from inside the app,
// not by emailing someone. It is also the one action here with no undo, so it
// asks for the email on the account before it will run.
export default function DeleteAccount({ isOwner }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = email.trim().toLowerCase() === String(user?.email || "").trim().toLowerCase();

  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("deleteAccount", { confirm_email: email.trim() });
      if (res?.error) throw new Error(res.error);
      logout();
    } catch (e) {
      setError(e.message || "The account could not be deleted. Try again, or contact support.");
      setBusy(false);
    }
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">Delete my account</div>
        <div className="text-sm font-semibold break-words">Permanent. There is no undo.</div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold break-words">
          {isOwner
            ? "Deletes your login and the whole log: every entry, every day, every surgery, your measurements, garments, med groups, and your care team's access."
            : "Deletes your login and removes you from the care teams you belong to. The patient's log stays."}
        </p>

        {!open ? (
          <button className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2" onClick={() => setOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <Field label="Type your email" hint={user?.email} span>
              <input
                type="email"
                autoComplete="off"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={user?.email || "you@example.com"}
                className="nb-input"
              />
            </Field>
            {error && <p className="text-sm font-semibold text-destructive break-words">{error}</p>}
            <div className="flex gap-2 min-w-0">
              <button
                className="nb-btn flex-1 min-w-0 h-12 bg-destructive text-destructive-foreground disabled:opacity-40"
                disabled={!matches || busy}
                onClick={remove}
              >
                {busy ? "Deleting…" : "Delete for good"}
              </button>
              <button className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
