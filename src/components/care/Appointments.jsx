import React, { useEffect, useState } from "react";
import { Calendar, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";
import { niceDate } from "@/lib/dates";
import { showTime } from "@/components/recovery/Fields";
import { PROVIDER_TYPES } from "@/lib/providers";
import Field from "@/components/Field";
import ProviderSelect from "@/components/care/ProviderSelect";

// Appointments are typed in by provider name — no invitation, no care team
// row. The type dropdown is the same list offered on a care team member, so a
// provider added here and one added there read the same way.
export default function Appointments() {
  const { patientId, isOwner } = usePatient();
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ provider_name: "", provider_type: "", date: "", time: "", location: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!patientId) return;
    try {
      const r = asRows(await base44.entities.Appointment.filter({ patient_id: patientId }, "date", 100));
      const today = new Date().toISOString().slice(0, 10);
      setRows(r.filter((a) => (a.date || "") >= today).sort((a, b) => (a.date || "").localeCompare(b.date || "")));
    } catch { /* best effort */ }
  };

  useEffect(() => { load(); }, [patientId]);

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
      setForm({ provider_name: "", provider_type: "", date: "", time: "", location: "", notes: "" });
      setAdding(false);
      load();
    } catch { /* best effort */ }
    setBusy(false);
  };

  const remove = async (id) => {
    try { await base44.entities.Appointment.delete(id); } catch { /* already gone */ }
    load();
  };

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
        <Calendar className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl uppercase leading-tight break-words">Appointments</div>
          <div className="text-sm font-semibold break-words">Upcoming visits and check-ups.</div>
        </div>
        {isOwner && (
          <button type="button" className="nb-btn h-9 w-9 shrink-0 bg-card p-0" aria-label="Add appointment" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {adding && (
          <div className="border-2 rounded-xl bg-background p-3 space-y-3">
            <ProviderSelect
              value={form.provider_name}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            />
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
              <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={() => setAdding(false)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}

        {rows.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground break-words">No upcoming appointments.</p>
        )}

        {rows.map((a) => (
          <div key={a.id} className="border-2 rounded-xl bg-background p-3 space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{a.provider_name}</div>
                <div className="text-xs font-semibold text-muted-foreground break-words">
                  {niceDate(a.date)}{a.time ? ` · ${showTime(a.time)}` : ""}{a.provider_type ? ` · ${a.provider_type}` : ""}
                </div>
                {a.location && <div className="text-xs font-semibold break-words">{a.location}</div>}
                {a.notes && <div className="text-xs break-words mt-0.5">{a.notes}</div>}
              </div>
              {isOwner && (
                <button type="button" onClick={() => remove(a.id)} className="nb-btn h-11 w-11 shrink-0 bg-card" aria-label="Remove appointment">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}