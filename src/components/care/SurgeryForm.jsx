import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { todayStr, postOpLabel, fullDate } from "@/lib/dates";
import Field from "@/components/Field";
import TimeInput from "@/components/recovery/TimeInput";

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

// The form for adding or editing a surgery. Lives inside a modal on the care
// page so the list stays a list.
export default function SurgeryForm({ surgery, prefillTrack, onSaved, onCancel }) {
  const { patientId, selectSurgery, refreshSurgeries } = usePatient();
  const [draft, setDraft] = useState({ ...BLANK, ...(surgery || {}) });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const text = (k) => (e) => set(k, e.target.value);
  const num = (k) => (e) => set(k, e.target.value === "" ? null : +e.target.value);

  const save = async () => {
    if (!draft.label?.trim()) return;
    setSaving(true);
    const fields = {
      label: draft.label.trim(),
      surgery_date: draft.surgery_date || null,
      surgery_time: draft.surgery_time || null,
      procedure: draft.procedure || null,
      surgeon: draft.surgeon || null,
      office_phone: draft.office_phone || null,
      fever_threshold: draft.fever_threshold === "" ? null : draft.fever_threshold,
      notes: draft.notes || null
    };
    if (draft.id) {
      await base44.entities.Surgery.update(draft.id, fields);
    } else {
      const created = await base44.entities.Surgery.create({
        ...fields,
        patient_id: patientId,
        track_before: prefillTrack?.track_before ?? true,
        track_after: prefillTrack?.track_after ?? true,
        archived: false
      });
      selectSurgery(created.id);
    }
    await refreshSurgeries();
    setSaving(false);
    onSaved?.();
  };

  const status = draft.surgery_date
    ? postOpLabel(draft.surgery_date, todayStr()) || "Surgery date not set"
    : "Surgery date not set";

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h2 className="font-display text-xl uppercase leading-tight break-words">
          {draft.id ? "Edit surgery" : "New surgery"}
        </h2>
        <div className="text-sm font-semibold break-words">
          {draft.surgery_date
            ? `${status} · ${fullDate(draft.surgery_date)}${draft.surgery_time ? ` · ${draft.surgery_time}` : ""}`
            : "Surgery date not set"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 min-w-0">
        <Field label="Name" span hint="shown in the day picker">
          <input
            type="text"
            value={draft.label ?? ""}
            placeholder="e.g. Tummy tuck, Left knee"
            onChange={text("label")}
            className="nb-input"
          />
        </Field>
        <Field label="Surgery date" span>
          <input type="date" value={draft.surgery_date ?? ""} onChange={text("surgery_date")} className="nb-input" />
        </Field>
        <Field label="Surgery time" span>
          <TimeInput value={draft.surgery_time ?? ""} onChange={(t) => set("surgery_time", t)} />
        </Field>
        <Field label="Procedure" span>
          <input
            type="text"
            value={draft.procedure ?? ""}
            placeholder="e.g. abdominal liposuction, lipedema"
            onChange={text("procedure")}
            className="nb-input"
          />
        </Field>
        <Field label="Surgeon" span>
          <input type="text" value={draft.surgeon ?? ""} placeholder="e.g. Dr. Vega" onChange={text("surgeon")} className="nb-input" />
        </Field>
        <Field label="Office phone">
          <input
            type="tel"
            inputMode="tel"
            value={draft.office_phone ?? ""}
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
            value={draft.fever_threshold ?? ""}
            placeholder="101.5"
            onChange={num("fever_threshold")}
            className="nb-input"
          />
        </Field>
        <Field label="Notes" span>
          <textarea
            rows={4}
            value={draft.notes ?? ""}
            placeholder="Restrictions, drains, garment schedule, follow-up…"
            onChange={text("notes")}
            className="nb-textarea"
          />
        </Field>

        <div className="col-span-2 flex gap-2 min-w-0">
          <button
            type="button"
            className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground"
            onClick={save}
            disabled={saving || !draft.label?.trim()}
          >
            {saving ? "Saving…" : draft.id ? "Save" : "Add surgery"}
          </button>
          <button type="button" className="nb-btn h-14 px-5 shrink-0 bg-card" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}