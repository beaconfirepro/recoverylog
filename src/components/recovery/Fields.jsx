import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Clock, Loader2, Minus, Plus, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Field from "@/components/Field";
import { nowTime } from "@/lib/dates";

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

// Every entry can carry a note, but on most of them it stays empty, so it costs
// no height until it is asked for. An entry that already has one opens showing it.
export function NoteField({ value, onChange }) {
  const [open, setOpen] = useState(!!value);
  if (!open) {
    return (
      <div className="col-span-2 min-w-0">
        <button
          type="button"
          className="nb-label flex items-center gap-1.5 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add a note
        </button>
      </div>
    );
  }
  return (
    <Field label="Note" span>
      <textarea
        className="nb-textarea min-h-[5rem]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="anything else?"
      />
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

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const pad = (n) => String(n).padStart(2, "0");

const readTime = (v) => {
  const [H, M] = String(v || "").split(":").map(Number);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
  return { h12: H % 12 === 0 ? 12 : H % 12, m: M, mer: H < 12 ? "AM" : "PM" };
};

const writeTime = ({ h12, m, mer }) =>
  `${pad(mer === "AM" ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12)}:${pad(m)}`;

export const showTime = (v) => {
  const t = readTime(v);
  return t ? `${t.h12}:${pad(t.m)} ${t.mer}` : "Not set";
};

// The system time wheel is the same grey drum in every app and it takes the
// screen to use. This shows the time already set to now and stays shut until
// it is asked for; opening it is a choice, not something that happens to you.
export function TimeField({ label, value, onChange, span }) {
  const [open, setOpen] = useState(false);
  const t = readTime(value) || readTime(nowTime());
  const minutes = MINUTES.includes(t.m) ? MINUTES : [...MINUTES, t.m].sort((a, b) => a - b);
  const set = (patch) => onChange(writeTime({ ...t, ...patch }));

  const toggle = () => {
    // An empty field lands on now rather than on an empty grid, so adjusting
    // from the right ballpark is the worst case.
    if (!value) onChange(nowTime());
    setOpen((o) => !o);
  };

  return (
    <Field label={label} span={span}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="nb-input flex items-center justify-between gap-2 text-left"
      >
        <span className="font-heading text-base tracking-wide">{showTime(value)}</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {open ? "Done" : "Change"}
        </span>
      </button>

      {open && (
        <div className="border-2 rounded-xl bg-card p-2.5 space-y-2.5">
          <div className="flex flex-wrap gap-1">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => set({ h12: h })}
                className={`nb-chip w-10 px-0 text-center tabular-nums ${t.h12 === h ? "bg-foreground text-background" : ""}`}
              >
                {h}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set({ m })}
                className={`nb-chip w-10 px-0 text-center tabular-nums ${t.m === m ? "bg-foreground text-background" : ""}`}
              >
                :{pad(m)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["AM", "PM"].map((mer) => (
              <button
                key={mer}
                type="button"
                onClick={() => set({ mer })}
                className={`nb-btn h-11 ${t.mer === mer ? "bg-foreground text-background" : "bg-card"}`}
              >
                {mer}
              </button>
            ))}
            <button type="button" onClick={() => onChange(nowTime())} className="nb-btn h-11 bg-accent text-accent-foreground">
              Now
            </button>
          </div>
        </div>
      )}
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
