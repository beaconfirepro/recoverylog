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
export function useLegal() {
  const { user, isAuthenticated } = useAuth();
  const [docs, setDocs] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const [published, accepted] = await Promise.all([
        base44.entities.LegalDoc.filter({ current: true }, "kind", 20),
        base44.entities.Consent.list("-accepted_at", 100)
      ]);
      const rows = asRows(published).sort(byOrder);
      // No documents is not "nothing to agree to". It is a read that did not
      // work, and the gate must hold rather than wave everyone through.
      if (rows.length !== DOC_ORDER.length) throw new Error("The terms could not be loaded.");
      setDocs(rows);
      setMine(asRows(accepted));
    } catch {
      setDocs([]);
      setMine([]);
      setFailed(true);
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

  return { docs, loading, failed, outstanding, acceptedVersion, accept, reload: load };
}
