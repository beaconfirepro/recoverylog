import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { asRows } from "@/lib/recoveryUtils";

// A patient owns a log; a care team member reads one. The two halves are kept
// apart because the answers differ, and reading the wrong half is how somebody
// concludes the app cannot do something it can.
export const HELP_ORDER = ["patient", "care_team"];

const byOrder = (a, b) => HELP_ORDER.indexOf(a.kind) - HELP_ORDER.indexOf(b.kind);

// Read from the HelpDoc table rather than shipped in this bundle, the same way
// the legal documents are, so the answers can be corrected without a deploy —
// which matters more here than there, because help goes stale every time the
// app changes underneath it.
//
// Unlike the legal documents this is not consent: nothing is version-gated,
// nothing is recorded, and a failed read hides the help rather than stopping
// the app. Somebody looking for an answer and not finding one is a bad
// afternoon; the consent gate failing open is a different kind of problem.
export function useHelp() {
  const { isAuthenticated, user } = useAuth();
  const [docs, setDocs] = useState([]);
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
      const rows = await base44.entities.HelpDoc.filter({ current: true }, "kind", 20);
      setDocs(asRows(rows).sort(byOrder));
    } catch (e) {
      setDocs([]);
      setError(e.message || "Help could not be loaded.");
    }
    setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    load();
  }, [load]);

  const forKind = (kind) => docs.find((d) => d.kind === kind) || null;

  return { docs, loading, error, forKind, reload: load };
}
