import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { todayStr, postOpLabel, fullDate } from "@/lib/dates";
import { Plus } from "lucide-react";
import Field from "@/components/Field";

const BLANK = {
  label: "",
  surgery_date: "",
  surgery_time: "",
  procedure: "",
  surgeon: "",
  office_phone: "",
  fever_threshold: "",
  notes: ""
};

export default function SurgeryInfo() {
  const { patientId, surgeries, activeSurgeryId, selectSurgery, refreshSurgeries } = usePatient();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const editing = draft ?? surgeries.find((s) => s.id === activeSurgeryId) ?? null;

  const set = (k, v) => {
    setDraft({ ...(editing || BLANK), [k]: v });
    setSaved(false);
  };
  const text = (k) => (e) => set(k, e.target.value);
  const num = (k) => (e) => set(k, e.target.value === "" ? null : +e.target.value);

  const save = async () => {
    if (!editing?.label?.trim()) return;
    setSaving(true);
    const fields = {
      label: editing.label.trim(),
      surgery_date: editing.surgery_date || null,
      surgery_time: editing.surgery_time || null,
      procedure: editing.procedure || null,
      surgeon: editing.surgeon || null,
      office_phone: editing.office_phone || null,
      fever_threshold: editing.fever_threshold === "" ? null : editing.fever_threshold,
      notes: editing.notes || null
    };
    if (editing.id) {
      await base44.entities.Surgery.update(editing.id, fields);
    } else {
      const created = await base44.entities.Surgery.create({
        ...fields,
        patient_id: patientId,
        track_before: true,
        track_after: true,
        archived: false
      });
      selectSurgery(created.id);
    }
    await refreshSurgeries();
    setDraft(null);
    setSaving(false);
    setSaved(true);
  };

  const status = editing?.surgery_date
    ? postOpLabel(editing.surgery_date, todayStr()) || "Surgery date not set"
    : "Surgery date not set";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Surgery</h1>

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Surgeries</div>
          <div className="text-sm font-semibold break-words">Each one keeps its own days and entries.</div>
        </div>
        <div className="p-4 space-y-2">
          {surgeries.length === 0 && (
            <p className="text-sm text-muted-foreground">None yet — add one below.</p>
          )}
          {surgeries.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                selectSurgery(s.id);
                setDraft(null);
                setSaved(false);
              }}
              className="nb-btn w-full h-12 justify-start px-3 text-left"
              style={
                s.id === activeSurgeryId && !draft
                  ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" }
                  : {}
              }
            >
              <span className="truncate">
                {s.label}
                {s.surgery_date ? ` · ${s.surgery_date}` : " · no date"}
                {s.archived ? " · archived" : ""}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="nb-btn w-full h-12 bg-accent text-accent-foreground flex items-center justify-center gap-2"
            onClick={() => {
              setDraft({ ...BLANK });
              setSaved(false);
            }}
          >
            <Plus className="w-4 h-4" />
            Add a surgery
          </button>
        </div>
      </div>

      {editing && (
        <div className="nb-card overflow-hidden">
          <div className={`px-4 py-3 border-b-2 ${editing.surgery_date ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
            <div className="font-display text-xl uppercase leading-tight break-words">
              {editing.id ? status : "New surgery"}
            </div>
            {editing.surgery_date && (
              <div className="text-sm font-semibold break-words">
                {fullDate(editing.surgery_date)}
                {editing.surgery_time ? ` · ${editing.surgery_time}` : ""}
              </div>
            )}
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
            <Field label="Name" span hint="shown in the day picker">
              <input
                type="text"
                value={editing.label ?? ""}
                placeholder="e.g. Tummy tuck, Left knee"
                onChange={text("label")}
                className="nb-input"
              />
            </Field>

            <Field label="Surgery date">
              <input type="date" value={editing.surgery_date ?? ""} onChange={text("surgery_date")} className="nb-input" />
            </Field>
            <Field label="Surgery time">
              <input type="time" value={editing.surgery_time ?? ""} onChange={text("surgery_time")} className="nb-input" />
            </Field>

            <Field label="Procedure" span>
              <input
                type="text"
                value={editing.procedure ?? ""}
                placeholder="e.g. abdominal liposuction, lipedema"
                onChange={text("procedure")}
                className="nb-input"
              />
            </Field>

            <Field label="Surgeon" span>
              <input type="text" value={editing.surgeon ?? ""} placeholder="e.g. Dr. Vega" onChange={text("surgeon")} className="nb-input" />
            </Field>

            <Field label="Office phone">
              <input
                type="tel"
                inputMode="tel"
                value={editing.office_phone ?? ""}
                placeholder="(555) 123-4567"
                onChange={text("office_phone")}
                className="nb-input"
              />
            </Field>
            <Field label="Call if fever over °F">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={editing.fever_threshold ?? ""}
                placeholder="101.5"
                onChange={num("fever_threshold")}
                className="nb-input"
              />
            </Field>

            <Field label="Notes" span>
              <textarea
                rows={4}
                value={editing.notes ?? ""}
                placeholder="restrictions, drains, garment schedule, follow-up date…"
                onChange={text("notes")}
                className="nb-textarea"
              />
            </Field>

            <button
              className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground"
              onClick={save}
              disabled={saving || !editing.label?.trim()}
            >
              {saving ? "Saving…" : editing.id ? "Save" : "Add surgery"}
            </button>
            {saved && !saving && <p className="col-span-2 text-sm font-bold text-center">Saved ✔</p>}
          </div>
        </div>
      )}
    </div>
  );
}
