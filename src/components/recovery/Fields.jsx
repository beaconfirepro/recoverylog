import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fillStyle = (active, color, darkText) =>
  active ? { backgroundColor: color, color: darkText ? "#1A1024" : "#fff" } : {};

export function ScaleField({ field, value, onChange, color }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {field.lowIs === "bad" ? "10 = worst" : "10 = best"}
        </span>
      </div>
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
    </div>
  );
}

export function ChipsField({ field, value, onChange, color, darkText }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
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
    </div>
  );
}

export function ChipsMultiField({ field, value = [], onChange, color, darkText }) {
  const toggle = (opt) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
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
    </div>
  );
}

export function NumberField({ field, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
      <Input
        type="number"
        inputMode={field.decimal ? "decimal" : "numeric"}
        step={field.decimal ? "0.1" : "1"}
        min="0"
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : +e.target.value)}
        className="h-12 text-lg font-semibold"
      />
      {field.steps && (
        <div className="flex flex-wrap gap-1.5">
          {field.steps.map((s) => (
            <button key={s} type="button" onClick={() => onChange(s)} className="nb-chip h-9 px-3 text-xs bg-muted">
              +{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TextField({ field, value, onChange }) {
  return (
    <div className="space-y-1.5">
      {field?.label && <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>}
      <Input
        placeholder={field?.placeholder || ""}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12"
      />
    </div>
  );
}

export function TimeField({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{label}</Label>
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 text-lg font-semibold" />
    </div>
  );
}

export function SpotsField({ field, value, onChange, spots }) {
  const vals = value || {};
  return (
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
      {spots.length === 0 && (
        <p className="text-sm text-muted-foreground">No spots yet — tap the day header and name your spots first.</p>
      )}
      {spots.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <span className="flex-1 text-sm font-semibold">{s.name}</span>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.25"
            placeholder="in"
            value={vals[s.name] ?? ""}
            onChange={(e) => onChange({ ...vals, [s.name]: e.target.value === "" ? "" : +e.target.value })}
            className="w-24 h-11"
          />
        </div>
      ))}
    </div>
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
    <div className="space-y-1.5">
      <Label className="font-heading text-xs uppercase tracking-wide">{field.label}</Label>
      <label className="flex items-center justify-center gap-2 h-16 border-2 rounded-xl font-heading text-sm uppercase cursor-pointer bg-muted">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        {busy ? "Uploading…" : value ? "Change photo" : "Take / choose photo"}
        <input type="file" accept="image/*" className="hidden" onChange={handle} />
      </label>
      {value && (
        <Image src={value} alt="photo preview" fittingType="fit" className="h-32 w-full border-2 rounded-xl" />
      )}
    </div>
  );
}