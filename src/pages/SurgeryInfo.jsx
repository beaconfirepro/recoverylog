import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { todayStr, postOpLabel, fullDate } from "@/lib/dates";
import Field from "@/components/Field";

export default function SurgeryInfo() {
  const { patientId } = usePatient();
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const run = async () => {
      const existing = await base44.entities.SurgeryInfo.list("created_date", 1);
      setInfo(existing[0] || {});
    };
    run();
  }, []);

  if (!info) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const set = (k, v) => {
    setInfo((i) => ({ ...i, [k]: v }));
    setSaved(false);
  };

  const text = (k) => (e) => set(k, e.target.value === "" ? null : e.target.value);
  const num = (k) => (e) => set(k, e.target.value === "" ? null : +e.target.value);

  const save = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by_id, ...fields } = info;
    if (info.id) {
      await base44.entities.SurgeryInfo.update(info.id, fields);
    } else {
      setInfo(await base44.entities.SurgeryInfo.create({ ...fields, patient_id: patientId }));
    }
    setSaving(false);
    setSaved(true);
  };

  const status = postOpLabel(info.surgery_date, todayStr()) || "Surgery date not set";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Surgery</h1>

      <div className="nb-card overflow-hidden">
        <div className={`px-4 py-3 border-b-2 ${info.surgery_date ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
          <div className="font-display text-xl uppercase leading-tight break-words">{status}</div>
          {info.surgery_date && (
            <div className="text-sm font-semibold break-words">
              {fullDate(info.surgery_date)}
              {info.surgery_time ? ` · ${info.surgery_time}` : ""}
            </div>
          )}
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
          <Field label="Surgery date">
            <input type="date" value={info.surgery_date ?? ""} onChange={text("surgery_date")} className="nb-input" />
          </Field>
          <Field label="Surgery time">
            <input type="time" value={info.surgery_time ?? ""} onChange={text("surgery_time")} className="nb-input" />
          </Field>

          <Field label="Procedure" span>
            <input
              type="text"
              value={info.procedure ?? ""}
              placeholder="e.g. abdominal liposuction, lipedema"
              onChange={text("procedure")}
              className="nb-input"
            />
          </Field>

          <Field label="Surgeon" span>
            <input type="text" value={info.surgeon ?? ""} placeholder="e.g. Dr. Vega" onChange={text("surgeon")} className="nb-input" />
          </Field>

          <Field label="Office phone">
            <input
              type="tel"
              inputMode="tel"
              value={info.office_phone ?? ""}
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
              value={info.fever_threshold ?? ""}
              placeholder="101.5"
              onChange={num("fever_threshold")}
              className="nb-input"
            />
          </Field>

          <Field label="Notes" span>
            <textarea
              rows={4}
              value={info.notes ?? ""}
              placeholder="restrictions, drains, garment schedule, follow-up date…"
              onChange={text("notes")}
              className="nb-textarea"
            />
          </Field>

          <button className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && !saving && <p className="col-span-2 text-sm font-bold text-center">Saved ✔</p>}
        </div>
      </div>
    </div>
  );
}
