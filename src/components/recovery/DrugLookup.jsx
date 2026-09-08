import React, { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchDrugs } from "@/lib/rxnorm";

// Type a few letters, get real drug names with their strengths. Nothing is
// stored until one is picked, and a lookup that cannot be reached says so
// rather than quietly offering whatever was typed as if it had been checked.
export default function DrugLookup({ onPick, onCancel }) {
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 3) {
      setRows([]);
      setFailed(false);
      return;
    }
    // A search per keystroke would be a search per letter of "gabapentin".
    let live = true;
    const t = setTimeout(async () => {
      setBusy(true);
      setFailed(false);
      try {
        const found = await searchDrugs(q);
        if (live) setRows(found);
      } catch {
        if (live) {
          setRows([]);
          setFailed(true);
        }
      }
      if (live) setBusy(false);
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [term]);

  const q = term.trim();

  return (
    <div className="border-2 rounded-xl bg-card p-2.5 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search for a medicine"
          className="nb-input"
        />
        {busy && <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
      </div>

      {failed && (
        <p className="text-sm font-semibold text-destructive break-words">
          The drug lookup could not be reached. Type the name from the bottle instead.
        </p>
      )}

      {!failed && q.length >= 3 && !busy && rows.length === 0 && (
        <p className="text-sm text-muted-foreground break-words">Nothing matched “{q}”.</p>
      )}

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {rows.map((r) => (
          <button
            key={r.rxcui}
            type="button"
            onClick={() => onPick({ name: r.name, rxcui: r.rxcui })}
            className="w-full text-left border-2 rounded-xl bg-background px-2.5 py-2 text-sm font-semibold break-words"
          >
            {r.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 min-w-0">
        <button
          type="button"
          onClick={() => q && onPick({ name: q })}
          disabled={!q}
          className="nb-btn flex-1 min-w-0 h-11 bg-card disabled:opacity-40"
        >
          Use “{q || "…"}” as typed
        </button>
        <button type="button" onClick={onCancel} className="nb-btn h-11 px-4 shrink-0 bg-card">
          Cancel
        </button>
      </div>
    </div>
  );
}
