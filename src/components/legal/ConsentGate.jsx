import React, { useState } from "react";
import { AlertTriangle, Check, ChevronRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useLegal } from "@/lib/legal";
import DocReader from "./DocReader";
import Field from "@/components/Field";

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

// The consents screen. A document is agreed only once it has been on screen,
// and everyone — patient or care team — enters their date of birth here before
// they go any further. The date is saved to the account, so it is asked once
// and then held: the gate shows again only when a new document version is
// published, and the date-of-birth half stays silent the second time.
function Asking({ outstanding, accept, needsDob }) {
  const { user, logout, checkUserAuth } = useAuth();
  const [open, setOpen] = useState(null);
  const [read, setRead] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");

  const doc = outstanding.find((d) => d.kind === open);
  if (doc) return <Reading doc={doc} onClose={() => setOpen(null)} />;

  const docsPresent = outstanding.length > 0;
  const allRead = outstanding.every((d) => read.includes(d.kind));
  const dobReady = !needsDob || !!dob;
  const canAgree = allRead && dobReady && !busy;

  const openDoc = (kind) => {
    setOpen(kind);
    setRead((r) => (r.includes(kind) ? r : [...r, kind]));
  };

  const onAgree = async () => {
    setBusy(true);
    setError("");
    try {
      if (docsPresent) await accept();
      if (needsDob) {
        await base44.auth.updateMe({ dob });
        await checkUserAuth();
      }
    } catch (e) {
      setError(e.message || "Could not save. Try again.");
      setBusy(false);
    }
  };

  const label = busy
    ? "Saving…"
    : docsPresent && needsDob
      ? allRead && dob
        ? "I agree"
        : "Open each one and enter your date of birth"
      : docsPresent
        ? allRead
          ? "I agree"
          : "Open each one to agree"
        : dob
          ? "Continue"
          : "Enter your date of birth";

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" /> {docsPresent ? "Before you start" : "Your date of birth"}
          </div>
          <div className="text-sm font-semibold break-words">
            {docsPresent
              ? needsDob
                ? "This log holds health information about you. Read these, then enter your date of birth and agree."
                : "This log holds health information about you. Read these, then agree to them."
              : "We need your date of birth before you go in."}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {docsPresent && (
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
          )}

          {needsDob && (
            <Field label="Your date of birth" hint="Required">
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="nb-input" />
            </Field>
          )}

          {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}

          {/* Agreeing to something unopened is not agreeing to it. The button
              stays shut until every document has been on screen, and — on a
              first visit — a date of birth is entered. */}
          <button
            className="nb-btn w-full h-14 bg-primary text-primary-foreground disabled:opacity-40"
            disabled={!canAgree}
            onClick={onAgree}
          >
            {label}
          </button>

          <p className="text-xs font-semibold text-muted-foreground break-words">
            Signed in as {user?.email}.{docsPresent ? " Agreeing records which version you read, and when." : ""}
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
// behind it. It also holds until the account has a date of birth — everyone
// enters one here, once.
export default function ConsentGate({ children }) {
  const { user } = useAuth();
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

  if (outstanding.length > 0 || !user?.dob) {
    return <Asking outstanding={outstanding} accept={accept} needsDob={!user?.dob} />;
  }

  return children;
}