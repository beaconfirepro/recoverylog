import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Loader2, Minus, Plus, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Field from "@/components/Field";

const fillStyle = (active, color, darkText) =>
  active ? { backgroundColor: color, color: darkText ? "#1A1024" : "#fff" } : {};

export function ScaleField({ field, value, onChange, color }) {
  return (
    <Field label={field.label} hint={field.lowIs === "bad" ? "10 = worst" : "10 = best"} span>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            className="w-9 h-11 border-2 rounded-lg font-heading text-sm"
            style={fillStyle(value === n, color, false)}
          >
            {n}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function ChipsField({ field, value, onChange, color, darkText }) {
  return (
    <Field label={field.label} span>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? undefined : opt)}
            className="nb-chip"
            style={fillStyle(value === opt, color, darkText)}
          >
            {opt}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function ChipsMultiField({ field, value = [], onChange, color, darkText }) {
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <Field label={field.label} span>
      <div className="flex flex-wrap gap-1.5">
        {field.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="nb-chip"
            style={fillStyle(value.includes(opt), color, darkText)}
          >
            {opt}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function NumberField({ field, value, onChange }) {
  return (
    <Field label={field.label} span>
      <input
        type="number"
        inputMode={field.decimal ? "decimal" : "numeric"}
        step={field.decimal ? "0.1" : "1"}
        min="0"
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : +e.target.value)}
        className="nb-input"
      />
      {field.steps && (
        <div className="flex flex-wrap gap-1.5 pt-1.5">
          {field.steps.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange((value || 0) + s)}
              className="nb-chip h-9 px-3 text-xs bg-muted"
            >
              +{s}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

const fmtDuration = (m) => {
  if (m == null) return "—";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  return r ? `${h}h ${r}m` : `${h}h`;
};

// Durations are entered by tapping, not typing: one tap = one step (15 min by
// default). Nothing to select, no keypad, and it reads back as 1h 30m.
export function DurationField({ field, value, onChange }) {
  const step = field.step ?? 15;
  const cur = value === "" || value == null ? null : +value;
  const bump = (delta) => {
    const next = Math.max(0, (cur ?? 0) + delta);
    onChange(next === 0 ? "" : next);
  };
  return (
    <Field label={field.label} hint={`${step} min steps`} span>
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => bump(-step)}
          disabled={cur == null}
          className="nb-btn h-12 w-12 shrink-0 bg-card disabled:opacity-40"
          aria-label={`Minus ${step} minutes`}
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 h-12 border-2 rounded-xl bg-muted flex items-center justify-center font-heading text-lg">
          {fmtDuration(cur)}
        </div>
        <button
          type="button"
          onClick={() => bump(step)}
          className="nb-btn h-12 w-12 shrink-0 bg-accent text-accent-foreground"
          aria-label={`Plus ${step} minutes`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Field>
  );
}

export function TextField({ field, value, onChange }) {
  return (
    <Field label={field?.label} span>
      <input
        type="text"
        placeholder={field?.placeholder || ""}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="nb-input"
      />
    </Field>
  );
}

export function TimeField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="nb-input" />
    </Field>
  );
}

// Spots are named here, in the one place they are also measured, so naming a
// spot and recording it are the same trip rather than two.
export function SpotsField({ field, value, onChange, spots, onAddSpot, onRemoveSpot }) {
  const [newSpot, setNewSpot] = useState("");
  const vals = value || {};

  const add = async () => {
    const name = newSpot.trim();
    if (!name) return;
    setNewSpot("");
    await onAddSpot(name);
  };

  return (
    <Field label={field.label} span>
      {spots.length === 0 && (
        <p className="text-sm text-muted-foreground">No spots yet — name one below and it will be here every day.</p>
      )}
      <div className="space-y-1.5">
        {spots.map((s) => (
          <div key={s.id} className="flex items-center gap-2 min-w-0">
            <span className="flex-1 min-w-0 truncate text-sm font-semibold">{s.name}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.25"
              placeholder="in"
              value={vals[s.name] ?? ""}
              onChange={(e) => onChange({ ...vals, [s.name]: e.target.value === "" ? "" : +e.target.value })}
              className="nb-input w-24 shrink-0"
            />
            <button
              type="button"
              onClick={() => onRemoveSpot(s.id)}
              className="nb-btn h-12 w-12 shrink-0 bg-card"
              aria-label={`Remove ${s.name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 min-w-0 pt-1.5">
        <input
          type="text"
          value={newSpot}
          onChange={(e) => setNewSpot(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="add a spot — e.g. waist, left thigh"
          className="nb-input"
        />
        <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-accent text-accent-foreground" onClick={add}>
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Field>
  );
}

export function FileField({ field, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setBusy(false);
  };
  return (
    <Field label={field.label} span>
      <label className="flex items-center justify-center gap-2 h-16 border-2 rounded-xl font-heading text-sm uppercase cursor-pointer bg-muted">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        {busy ? "Uploading…" : value ? "Change photo" : "Take / choose photo"}
        <input type="file" accept="image/*" className="hidden" onChange={handle} />
      </label>
      {value && (
        <Image src={value} alt="photo preview" fittingType="fit" className="h-32 w-full border-2 rounded-xl mt-1.5" />
      )}
    </Field>
  );
}
