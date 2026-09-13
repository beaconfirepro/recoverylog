import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient, displayName } from "@/lib/PatientContext";
import { useCareTeam } from "@/lib/careTeam";
import Field from "@/components/Field";

// The add-task form used inside the Day page dialog. A task is assigned to the
// patient or a care team member by name, with a due date.
export default function TaskForm({ onDone }) {
  const { patientId, patient } = usePatient();
  const { team } = useCareTeam();
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "patient", due_date: "" });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.title.trim() || !form.due_date) return;
    setBusy(true);
    const assignedName = form.assigned_to === "patient"
      ? (displayName(patient) || "Patient")
      : form.assigned_to;
    try {
      await base44.entities.Task.create({
        patient_id: patientId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigned_to: assignedName,
        due_date: form.due_date,
        status: "open"
      });
      onDone?.();
    } catch { /* best effort */ }
    setBusy(false);
  };

  const assignOptions = [
    { value: "patient", label: displayName(patient) || "Patient" },
    ...team.map((m) => {
      const name = displayName(m) || m.email;
      return { value: name, label: name };
    })
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl uppercase break-words">Add task</h2>
      <Field label="Task" span>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call surgeon about stitches" className="nb-input" />
      </Field>
      <Field label="Assign to" span>
        <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="nb-select">
          {assignOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>
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
        <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={onDone} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}