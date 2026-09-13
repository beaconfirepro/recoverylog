import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { PROVIDER_TYPES } from "@/lib/providers";
import Field from "@/components/Field";

// The add-appointment form used inside the Day page dialog. The same fields as
// the care page's appointment card, without the list — just the form, so it
// opens from a tracker tile the way every other tracker does.
export default function AppointmentForm({ onDone }) {
  const { patientId } = usePatient();
  const [form, setForm] = useState({ provider_name: "", provider_type: "", date: "", time: "", location: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.provider_name.trim() || !form.date) return;
    setBusy(true);
    try {
      await base44.entities.Appointment.create({
        patient_id: patientId,
        provider_name: form.provider_name.trim(),
        provider_type: form.provider_type || undefined,
        date: form.date,
        time: form.time || undefined,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined
      });
      onDone?.();
    } catch { /* best effort */ }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl uppercase break-words">Add appointment</h2>
      <Field label="Provider name" span>
        <input type="text" value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} placeholder="Dr. Smith" className="nb-input" />
      </Field>
      <Field label="Type" span>
        <select value={form.provider_type} onChange={(e) => setForm({ ...form, provider_type: e.target.value })} className="nb-select">
          <option value="">Select a type</option>
          {PROVIDER_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3 min-w-0">
        <Field label="Date">
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="nb-input" />
        </Field>
        <Field label="Time">
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="nb-input" />
        </Field>
      </div>
      <Field label="Location" span>
        <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Main clinic, room 204" className="nb-input" />
      </Field>
      <Field label="Notes" span>
        <textarea className="nb-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything else" />
      </Field>
      <div className="flex gap-2 min-w-0">
        <button type="button" className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground" onClick={save} disabled={busy || !form.provider_name.trim() || !form.date}>
          {busy ? "Adding…" : "Add appointment"}
        </button>
        <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={onDone} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}