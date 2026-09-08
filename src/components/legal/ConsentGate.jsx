import React, { useState } from "react";
import { AlertTriangle, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLegal } from "@/lib/legal";
import DocReader from "./DocReader";

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

function Reading({ doc, onClose }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">{doc.title}</div>
          <div className="text-sm font-semibold break-words">Version {doc.version}</div>
        </div>
        <div className="p-4">
          <DocReader body={doc.body} />
        </div>
        <div className="p-4 pt-0">
          <button className="nb-btn w-full h-14 bg-primary text-primary-foreground" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Asking({ outstanding, accept }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(null);
  const [read, setRead] = useState([]);
  const [busy, setBusy] = useState(false);

  const doc = outstanding.find((d) => d.kind === open);
  if (doc) return <Reading doc={doc} onClose={() => setOpen(null)} />;

  const allRead = outstanding.every((d) => read.includes(d.kind));

  const openDoc = (kind) => {
    setOpen(kind);
    setRead((r) => (r.includes(kind) ? r : [...r, kind]));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" /> Before you start
          </div>
          <div className="text-sm font-semibold break-words">
            This log holds health information about you. Read these, then agree to them.
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            {outstanding.map((d) => (
              <button
                key={d.kind}
                type="button"
                onClick={() => openDoc(d.kind)}
                className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
              >
                <span className="flex-1 min-w-0">
                  <span className="block nb-label truncate">{d.title}</span>
                  <span className="block text-xs font-semibold text-muted-foreground break-words">{d.summary}</span>
                </span>
                {read.includes(d.kind) ? (
                  <Check className="w-5 h-5 shrink-0 text-green-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Agreeing to something unopened is not agreeing to it. The button
              stays shut until every document has actually been on screen. */}
          <button
            className="nb-btn w-full h-14 bg-primary text-primary-foreground disabled:opacity-40"
            disabled={!allRead || busy}
            onClick={async () => {
              setBusy(true);
              await accept();
            }}
          >
            {busy ? "Saving…" : allRead ? "I agree" : "Open each one to agree"}
          </button>

          <p className="text-xs font-semibold text-muted-foreground break-words">
            Signed in as {user?.email}. Agreeing records which version you read, and when.
          </p>

          <button className="nb-btn w-full h-12 bg-card" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// Stands between a signed-in account and the log. Nothing medical is typed in
// before the terms are agreed, so this sits in front of ClaimAccess rather than
// behind it.
export default function ConsentGate({ children }) {
  const { loading, error, outstanding, accept, reload } = useLegal();

  if (loading) return <Spinner />;

  // A read that failed must not be read as "nothing to agree to".
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="nb-card p-4 space-y-3">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-destructive" /> Terms unavailable
          </div>
          <p className="text-sm font-semibold break-words">
            The app could not load its privacy and permissions documents, so it cannot ask you to agree to them yet.
          </p>
          <p className="text-xs font-semibold text-muted-foreground break-words">{error}</p>
          <button className="nb-btn w-full h-12 bg-card" onClick={reload}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (outstanding.length > 0) return <Asking outstanding={outstanding} accept={accept} />;

  return children;
}
