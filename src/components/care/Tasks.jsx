import React, { useEffect, useState } from "react";
import { CheckSquare, Check, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePatient, displayName } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";
import { todayStr, daysBetween } from "@/lib/dates";
import Field from "@/components/Field";
import AssigneeSelect from "@/components/care/AssigneeSelect";

// Tasks are assigned to the patient or a care team member by name, with a due
// date. The patient creates and completes them; a care team member reads them.
export default function Tasks() {
  const { patientId, isOwner, patient } = usePatient();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "", due_date: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!patientId) return;
    try {
      const r = asRows(await base44.entities.Task.filter({ patient_id: patientId }, "due_date", 100));
      setRows(r.sort((a, b) => (a.due_date || "").localeCompare(b.due_date || "")));
    } catch { /* best effort */ }
  };

  useEffect(() => { load(); }, [patientId]);

  const save = async () => {
    if (!form.title.trim() || !form.due_date) return;
    setBusy(true);
    try {
      await base44.entities.Task.create({
        patient_id: patientId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigned_to: form.assigned_to || (displayName(patient) || "Patient"),
        due_date: form.due_date,
        status: "open"
      });
      setForm({ title: "", description: "", assigned_to: "", due_date: "" });
      setAdding(false);
      load();
    } catch { /* best effort */ }
    setBusy(false);
  };

  const toggleDone = async (t) => {
    try {
      await base44.entities.Task.update(t.id, { status: t.status === "done" ? "open" : "done" });
      load();
    } catch { /* best effort */ }
  };

  const remove = async (id) => {
    try { await base44.entities.Task.delete(id); } catch { /* already gone */ }
    load();
  };

  const dueLabel = (d) => {
    const days = daysBetween(todayStr(), d);
    if (days < 0) return `${-days}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days}d`;
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <CheckSquare className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Tasks</div>
          <div className="text-sm font-semibold break-words">Things to do, with due dates.</div>
        </div>
        {isOwner && (
          <button type="button" className="nb-btn h-9 w-9 shrink-0 bg-card p-0" aria-label="Add task" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {adding && (
          <div className="border-2 rounded-xl bg-background p-3 space-y-3">
            <Field label="Task" span>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call surgeon about stitches" className="nb-input" />
            </Field>
            <AssigneeSelect
              value={form.assigned_to}
              onChange={(name) => setForm((f) => ({ ...f, assigned_to: name }))}
            />
            <Field label="Due date" span>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="nb-input" />
            </Field>
            <Field label="Notes" span>
              <textarea className="nb-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Anything else" />
            </Field>
            <div className="flex gap-2 min-w-0">
              <button type="button" className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground" onClick={save} disabled={busy || !form.title.trim() || !form.due_date}>
                {busy ? "Adding…" : "Add task"}
              </button>
              <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={() => setAdding(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}

        {rows.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground break-words">No tasks yet.</p>
        )}

        {rows.map((t) => {
          const done = t.status === "done";
          const overdue = !done && (t.due_date || "") < todayStr();
          return (
            <div key={t.id} className={`border-2 rounded-xl bg-background p-3 flex items-start gap-2 min-w-0 ${done ? "opacity-60" : ""}`}>
              <button
                type="button"
                onClick={() => isOwner && toggleDone(t)}
                disabled={!isOwner}
                className="nb-btn h-11 w-11 shrink-0 bg-card mt-0.5"
                aria-label={done ? "Mark open" : "Mark done"}
              >
                <Check className={`w-4 h-4 ${done ? "text-accent" : ""}`} />
              </button>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className={`text-sm font-bold break-words ${done ? "line-through" : ""}`}>{t.title}</div>
                {t.description && <div className="text-xs break-words">{t.description}</div>}
                <div className="text-xs font-semibold break-words">
                  {t.assigned_to && <span className="text-muted-foreground">{t.assigned_to} · </span>}
                  <span className={overdue ? "text-destructive" : "text-muted-foreground"}>{dueLabel(t.due_date)}</span>
                </div>
              </div>
              {isOwner && (
                <button type="button" onClick={() => remove(t.id)} className="nb-btn h-11 w-11 shrink-0 bg-card mt-0.5" aria-label="Remove task">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}