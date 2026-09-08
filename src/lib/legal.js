import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { asRows } from "@/lib/recoveryUtils";

// The order they are read in. Also the order they appear on the gate and in
// Profile, so the privacy policy is the first thing anyone sees.
export const DOC_ORDER = ["privacy", "permissions", "pii_sharing"];

const byOrder = (a, b) => DOC_ORDER.indexOf(a.kind) - DOC_ORDER.indexOf(b.kind);

// The documents live in the LegalDoc table, not in this bundle. A shipped copy
// would go stale the moment one is reworded, and the version a person accepted
// has to be the version they were actually shown.
//
// They come through the legalDocs function rather than straight off the table.
// LegalDoc has no read rule, which denies rather than opens it, and that is
// deliberate: the function is the one door, so nothing in the browser can read
// the table and nothing can write to it either.
export function useLegal() {
  const { user, isAuthenticated } = useAuth();
  const [docs, setDocs] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [published, accepted] = await Promise.all([
        base44.functions.invoke("legalDocs", {}),
        base44.entities.Consent.list("-accepted_at", 100)
      ]);
      if (published?.error) throw new Error(published.error);
      const rows = asRows(published?.docs).sort(byOrder);
      // No documents is not "nothing to agree to". It is a read that did not
      // work, and the gate must hold rather than wave everyone through.
      if (rows.length !== DOC_ORDER.length) {
        throw new Error(`Expected ${DOC_ORDER.length} documents, got ${rows.length}.`);
      }
      setDocs(rows);
      setMine(asRows(accepted));
    } catch (e) {
      // A screen that stops the whole app has to say what went wrong. Throwing
      // the reason away left "could not load" and nothing to act on.
      setDocs([]);
      setMine([]);
      setError(e.message || "The terms could not be loaded.");
    }
    setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    load();
  }, [load]);

  // What this account has accepted, keyed by kind, newest first from the read.
  const acceptedVersion = (kind) => mine.find((c) => c.kind === kind) || null;

  const outstanding = docs.filter((d) => acceptedVersion(d.kind)?.version !== d.version);

  const accept = async () => {
    const at = new Date().toISOString();
    for (const doc of outstanding) {
      await base44.entities.Consent.create({
        email: user.email,
        kind: doc.kind,
        version: doc.version,
        accepted_at: at
      });
    }
    await load();
  };

  return { docs, loading, error, outstanding, acceptedVersion, accept, reload: load };
}
