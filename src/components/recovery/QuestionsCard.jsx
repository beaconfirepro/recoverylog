import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function QuestionsCard({ day, onSaved }) {
  const [list, setList] = useState(day.questions || []);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const persist = async (next) => {
    setSaving(true);
    await base44.entities.RecoveryDay.update(day.id, { questions: next });
    setList(next);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="nb-card p-4">
      <h2 className="font-heading text-sm uppercase tracking-wider mb-3">Questions for the surgeon</h2>
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the surgeon…"
          className="nb-input"
        />
        <button
          className="nb-btn h-12 px-4 shrink-0 bg-accent text-accent-foreground"
          onClick={() => {
            if (!text.trim()) return;
            persist([text.trim(), ...list]);
            setText("");
          }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {list.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {list.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-medium border-2 rounded-xl px-3 py-2 bg-muted">
              <span className="flex-1 min-w-0 break-words">{q}</span>
              <button onClick={() => persist(list.filter((_, j) => j !== i))} aria-label="Remove question">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {saving && <p className="text-xs text-muted-foreground mt-2">Saving…</p>}
    </div>
  );
}