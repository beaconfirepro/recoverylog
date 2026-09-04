import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { todayStr, daysBetween, parseDate } from "@/lib/dates";

const FIELDS = [
  { key: "surgery_date", label: "Surgery date", type: "date" },
  { key: "surgery_time", label: "Surgery time", type: "time" },
  { key: "procedure", label: "Procedure", type: "text", placeholder: "e.g. DIEP flap reconstruction" },
  { key: "surgeon", label: "Surgeon", type: "text", placeholder: "e.g. Dr. Vega" },
  { key: "office_phone", label: "Office phone", type: "tel", placeholder: "(555) 123-4567" },
  { key: "fever_threshold", label: "Call if fever over (°F)", type: "number", placeholder: "101.5" }
];

const inputCls = "w-full min-w-0 h-12 border-2 rounded-xl bg-card px-3 font-semibold";

export default function SurgeryInfo() {
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

  const save = async () => {
    setSaving(true);
    const { id, created_date, updated_date, created_by_id, ...fields } = info;
    if (info.id) {
      await base44.entities.SurgeryInfo.update(info.id, fields);
    } else {
      setInfo(await base44.entities.SurgeryInfo.create(fields));
    }
    setSaving(false);
    setSaved(true);
  };

  const dayCount = info.surgery_date ? daysBetween(info.surgery_date, todayStr()) : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Surgery</h1>

      {dayCount !== null && (
        <div className="nb-card p-4 bg-accent text-accent-foreground flex flex-col gap-0.5">
          <span className="font-display text-2xl uppercase leading-tight">
            {dayCount === 0 ? "Surgery day" : dayCount > 0 ? `Post-op day ${dayCount}` : "Scheduled"}
          </span>
          <span className="text-sm font-semibold">
            {parseDate(info.surgery_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
      )}

      <div className="nb-card p-4 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1 min-w-0">
            <label className="font-heading text-xs uppercase tracking-wide">{f.label}</label>
            <input
              type={f.type}
              step={f.key === "fever_threshold" ? "0.1" : undefined}
              value={info[f.key] ?? ""}
              placeholder={f.placeholder || ""}
              onChange={(e) => set(f.key, e.target.value === "" ? null : (f.type === "number" ? +e.target.value : e.target.value))}
              className={inputCls}
            />
          </div>
        ))}
        <div className="space-y-1">
          <label className="font-heading text-xs uppercase tracking-wide">Notes</label>
          <textarea
            rows={4}
            value={info.notes ?? ""}
            placeholder="restrictions, drains, garment schedule, follow-up date…"
            onChange={(e) => set("notes", e.target.value)}
            className="w-full min-w-0 border-2 rounded-xl bg-card px-3 py-2 font-medium resize-none"
          />
        </div>
        <button className="nb-btn w-full h-14 bg-primary text-primary-foreground" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && !saving && <p className="text-sm font-bold text-center">Saved ✔</p>}
      </div>
    </div>
  );
}