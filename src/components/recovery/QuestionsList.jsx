import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuestionsList({ day, onChange }) {
  const [text, setText] = useState('');
  const qs = day.questions || [];
  const add = () => {
    if (!text.trim()) return;
    onChange({ ...day, questions: [...qs, { text: text.trim(), answered: false }] });
    setText('');
  };
  const toggle = (i) => {
    const next = qs.map((q, idx) => (idx === i ? { ...q, answered: !q.answered } : q));
    onChange({ ...day, questions: next });
  };
  const remove = (i) => onChange({ ...day, questions: qs.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-base font-semibold">Questions for the Surgeon</h3>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a question…"
          className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button onClick={add} className="p-2.5 rounded-lg bg-primary text-primary-foreground"><Plus className="w-5 h-5" /></button>
      </div>
      {qs.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet.</p>}
      <div className="space-y-1.5">
        {qs.map((q, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
            <button onClick={() => toggle(i)} className={cn('shrink-0 w-6 h-6 rounded-full border flex items-center justify-center', q.answered ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border')}>
              {q.answered && <Check className="w-4 h-4" />}
            </button>
            <span className={cn('flex-1 text-sm', q.answered && 'line-through text-muted-foreground')}>{q.text}</span>
            <button onClick={() => remove(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}