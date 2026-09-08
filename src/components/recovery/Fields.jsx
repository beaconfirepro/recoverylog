import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Loader2, Minus, Plus, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Field from "@/components/Field";
import DrugLookup from "./DrugLookup";
import {
  BRISTOL, HUNGER_COLORS, HUNGER_LEVELS, INCISION_LEVELS, INCISION_SYMPTOMS,
  MEASUREMENTS, NUTRIENTS, gradeColor, nutrientUnit
} from "@/lib/recovery";

const fillStyle = (active, color, darkText) =>
  active ? { backgroundColor: color, color: darkText ? "#1A1024" : "#fff" } : {};

export function ScaleField({ field, value, onChange, color }) {
  return (
    <Field label={field.label} hint={field.highIs === "bad" ? "10 = worst" : "10 = best"} span>
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
        placeholder="Anything else"
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
    <Field label={field.label} hint={field.unit} span>
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

const pad = (n) => String(n).padStart(2, "0");

export const showTime = (v) => {
  const [H, M] = String(v || "").split(":").map(Number);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return "Not set";
  return `${H % 12 === 0 ? 12 : H % 12}:${pad(M)} ${H < 12 ? "AM" : "PM"}`;
};

// The browser's own time field: type it, or use the keypad it puts up. It opens
// on now because that is what almost every entry wants, and there is nothing
// else to press.
export function TimeField({ label, value, onChange, span }) {
  return (
    <Field label={label} span={span}>
      <input
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="nb-input"
      />
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

// Five levels, no faces: the bar is the whole control and the ends are named so
// you never have to remember which direction is good.
export function Scale5Field({ field, value, onChange }) {
  const [low, high] = field.ends;
  return (
    <Field label={field.label} span>
      <div className="flex justify-between nb-label text-muted-foreground">
        <span>1 {low}</span>
        <span>5 {high}</span>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            aria-pressed={value === n}
            className={`flex-1 min-w-0 border-2 rounded-lg font-heading text-sm transition-all duration-200 motion-reduce:transition-none ${
              value === n ? "h-14 text-white" : "h-9 bg-card text-muted-foreground"
            }`}
            style={value === n ? { backgroundColor: gradeColor(n - 1, 4, field.highIs) } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
    </Field>
  );
}

// Hunger is bad at both ends, so it gets its own colours rather than the ramp:
// 3 is the sweet spot, 1 and 5 are the painful ones.
function HungerRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="nb-label w-14 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 min-w-0 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? undefined : n)}
            aria-pressed={value === n}
            aria-label={`${label} ${HUNGER_LEVELS[n - 1]}`}
            className="flex-1 min-w-0 h-11 border-2 rounded-lg font-heading text-sm"
            style={value === n ? { backgroundColor: HUNGER_COLORS[n - 1], color: "#fff" } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HungerField({ field, value, onChange }) {
  const v = value || {};
  const set = (key, n) => onChange({ ...v, [key]: n });
  const said = v.after ?? v.before;
  return (
    <Field label={field.label} hint="1 painfully hungry · 3 comfortable · 5 painfully full" span>
      <div className="space-y-2">
        <HungerRow label="Before" value={v.before} onChange={(n) => set("before", n)} />
        <HungerRow label="After" value={v.after} onChange={(n) => set("after", n)} />
      </div>
      {said != null && <p className="nb-label text-muted-foreground">{HUNGER_LEVELS[said - 1]}</p>}
    </Field>
  );
}

// The Bristol chart is a picture in every clinic that uses it, so it is a
// picture here too. Drawn small and in the colour of the thing, because a large
// black diagram of a stool is not what anyone wants on their phone.
const BRISTOL_ART = [
  <g key="1">{[16, 34, 52, 70].map((x) => <circle key={x} cx={x} cy="14" r="5" />)}</g>,
  <g key="2"><rect x="10" y="6" width="66" height="16" rx="8" />{[28, 43, 58].map((x) => <rect key={x} x={x} y="4" width="3" height="20" fill="var(--art-gap)" />)}</g>,
  <g key="3"><rect x="8" y="8" width="70" height="12" rx="6" />{[30, 48, 66].map((x) => <rect key={x} x={x} y="6" width="2" height="16" fill="var(--art-gap)" />)}</g>,
  <g key="4"><rect x="6" y="9" width="74" height="10" rx="5" /></g>,
  <g key="5">{[20, 42, 64].map((x) => <ellipse key={x} cx={x} cy="14" rx="10" ry="6" />)}</g>,
  <g key="6"><path d="M8 18 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 q8 -10 16 0 v4 h-64 z" /></g>,
  <g key="7"><path d="M6 20 q12 -8 22 -2 q10 6 20 0 q10 -6 22 2 v2 h-64 z" /></g>
];

export function BristolField({ field, value, onChange, color }) {
  return (
    <Field label={field.label} span>
      <div className="space-y-1.5">
        {BRISTOL.map((text, i) => {
          const n = i + 1;
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(on ? undefined : n)}
              aria-pressed={on}
              className="w-full flex items-center gap-2.5 border-2 rounded-xl px-2.5 py-1.5 text-left"
              style={
                on
                  ? { backgroundColor: color, color: "#fff", "--art-gap": color }
                  : { "--art-gap": "hsl(var(--card))" }
              }
            >
              <span className="font-heading text-sm w-4 shrink-0">{n}</span>
              <svg viewBox="0 0 86 28" className="h-5 w-[86px] shrink-0" fill={on ? "#fff" : color} aria-hidden="true">
                {BRISTOL_ART[i]}
              </svg>
              <span className="text-sm font-semibold min-w-0 break-words">{text}</span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

// Judged by eye against a chart, so the chart is the control.
export function SwatchField({ field, value, onChange }) {
  return (
    <Field label={field.label} span>
      <div className="grid grid-cols-2 gap-1.5">
        {field.options.map(([name, swatch]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(value === name ? undefined : name)}
            aria-pressed={value === name}
            className={`flex items-center gap-2 min-w-0 border-2 rounded-xl px-2 py-1.5 text-left ${
              value === name ? "bg-foreground text-background" : "bg-card"
            }`}
          >
            <span className="w-5 h-5 shrink-0 border-2 rounded-md" style={{ backgroundColor: swatch }} />
            <span className="min-w-0 text-xs font-semibold break-words">{name}</span>
          </button>
        ))}
      </div>
    </Field>
  );
}

// Symptoms hang off the parts already marked on the map, so the question is
// never asked about a part that was not selected.
export function AreaSymptomsField({ field, areas, value, onChange, color, darkText }) {
  const findings = value || {};
  if (!areas.length) {
    return (
      <div className="col-span-2 min-w-0">
        <p className="text-sm text-muted-foreground">Mark a part above.</p>
      </div>
    );
  }
  const toggle = (area, sym) => {
    const cur = findings[area] || [];
    onChange({ ...findings, [area]: cur.includes(sym) ? cur.filter((s) => s !== sym) : [...cur, sym] });
  };
  return (
    <Field label={field.label} span>
      <div className="space-y-2">
        {areas.map((area) => (
          <div key={area} className="border-2 rounded-xl bg-card p-2.5">
            <div className="nb-label mb-1.5">{area}</div>
            <div className="flex flex-wrap gap-1.5">
              {field.options.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggle(area, sym)}
                  className="nb-chip"
                  style={(findings[area] || []).includes(sym) ? fillStyle(true, color, darkText) : {}}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Field>
  );
}

// One severity per marked incision, worst last. Marking one Minor or above
// opens the symptom pills for it; a normal incision is not asked, because there
// is nothing to say about it.
export function IncisionsField({ field, areas, value, onChange }) {
  const status = value || {};
  if (!areas.length) {
    return (
      <div className="col-span-2 min-w-0">
        <p className="text-sm text-muted-foreground">Mark an incision above.</p>
      </div>
    );
  }
  const setLevel = (area, level) =>
    onChange({ ...status, [area]: { ...(status[area] || {}), level } });
  const toggleSymptom = (area, sym) => {
    const cur = status[area]?.symptoms || [];
    onChange({
      ...status,
      [area]: { ...(status[area] || {}), symptoms: cur.includes(sym) ? cur.filter((s) => s !== sym) : [...cur, sym] }
    });
  };
  return (
    <Field label={field.label} span>
      <div className="space-y-2">
        {areas.map((area) => {
          const cur = status[area] || {};
          const tint = INCISION_LEVELS.find(([l]) => l === cur.level)?.[1];
          return (
            <div key={area} className="border-2 rounded-xl bg-card p-2.5 space-y-2">
              <div className="nb-label">{area}</div>
              <div className="grid grid-cols-4 gap-1">
                {INCISION_LEVELS.map(([level, tone]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLevel(area, cur.level === level ? undefined : level)}
                    aria-pressed={cur.level === level}
                    className="h-10 border-2 rounded-lg font-heading text-[11px] uppercase"
                    style={cur.level === level ? { backgroundColor: tone, color: level === "Minor" ? "#1A1024" : "#fff" } : {}}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {cur.level && cur.level !== "Normal" && (
                <div>
                  <span className="nb-label text-muted-foreground">What&rsquo;s wrong</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {INCISION_SYMPTOMS.map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(area, sym)}
                        className="nb-chip text-xs px-2.5 py-1.5"
                        style={(cur.symptoms || []).includes(sym) ? { backgroundColor: tint, color: cur.level === "Minor" ? "#1A1024" : "#fff" } : {}}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Field>
  );
}

// The tape-measure sheet. Written as text rather than a number because these
// come off a tape in eighths: "16 3/8" is the reading, not 16.375.
export function MeasurementsField({ field, value, onChange }) {
  const vals = value || {};
  const setPair = (name, side, v) =>
    onChange({ ...vals, [name]: { ...(vals[name] || {}), [side]: v } });

  return (
    <Field label={field.label} hint="inches" span>
      <div className="flex gap-2 min-w-0">
        <span className="flex-1 min-w-0" />
        <span className="nb-label w-24 shrink-0 text-center text-muted-foreground">Right</span>
        <span className="nb-label w-24 shrink-0 text-center text-muted-foreground">Left</span>
      </div>
      <div className="space-y-1.5">
        {MEASUREMENTS.map((m) => (
          <div key={m.name} className="flex items-center gap-2 min-w-0">
            <span className="flex-1 min-w-0 truncate text-sm font-semibold">{m.name}</span>
            {m.pair ? (
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vals[m.name]?.r || ""}
                  onChange={(e) => setPair(m.name, "r", e.target.value)}
                  className="nb-input w-24 shrink-0 text-center"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={vals[m.name]?.l || ""}
                  onChange={(e) => setPair(m.name, "l", e.target.value)}
                  className="nb-input w-24 shrink-0 text-center"
                />
              </>
            ) : (
              <input
                type="text"
                inputMode="decimal"
                value={typeof vals[m.name] === "string" ? vals[m.name] : ""}
                onChange={(e) => onChange({ ...vals, [m.name]: e.target.value })}
                className="nb-input w-[13rem] shrink-0 text-center"
              />
            )}
          </div>
        ))}
      </div>
    </Field>
  );
}

// One screen for every nutrient rather than one tracker each: type into the
// ones you are tracking today and leave the rest empty.
export function NutrientsField({ field, value, onChange }) {
  const vals = value || {};
  return (
    <Field label={field.label} span>
      <div className="space-y-1.5">
        {NUTRIENTS.map((n) => (
          <div key={n.name} className="flex items-center gap-2 min-w-0">
            <span className="flex-1 min-w-0 truncate text-sm font-semibold">{n.name}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={vals[n.name] ?? ""}
              onChange={(e) => onChange({ ...vals, [n.name]: e.target.value === "" ? "" : +e.target.value })}
              className="nb-input w-24 shrink-0"
            />
            <span className="nb-label w-8 shrink-0 text-muted-foreground">{nutrientUnit(n.name)}</span>
          </div>
        ))}
      </div>
    </Field>
  );
}

// Her garments, set up once in the profile and picked here. The add button
// saves straight into that library without leaving the entry half-filled.
export function GarmentField({ field, value, onChange, garments, onAddGarment, color, darkText }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    setName("");
    setSize("");
    setAdding(false);
    await onAddGarment({ name: n, size: size.trim() });
    onChange(n);
  };

  return (
    <Field label={field.label} span>
      {garments.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No garments yet.</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {garments.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(value === g.name ? undefined : g.name)}
            className="nb-chip"
            style={fillStyle(value === g.name, color, darkText)}
          >
            {g.name}
            {g.size && <span className="opacity-70">{"\u00a0· "}{g.size}</span>}
          </button>
        ))}
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="nb-chip gap-1.5 bg-muted">
            <Plus className="w-3.5 h-3.5" /> Add a garment
          </button>
        )}
      </div>
      {adding && (
        <div className="flex gap-2 min-w-0 pt-1.5">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marena stage 1"
            className="nb-input"
          />
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Size"
            className="nb-input w-20 shrink-0"
          />
          <button type="button" onClick={save} className="nb-btn h-12 px-4 shrink-0 bg-accent text-accent-foreground">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}
    </Field>
  );
}

// Picking a group brings up everything in it, already ticked. Tap one off if
// you skipped it; Add looks the rest up.
export function MedGroupField({ field, value, onChange, groups, color, darkText }) {
  return (
    <Field label={field.label} span>
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">No med groups yet. Add one in Profile.</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(value === g.name ? undefined : g.name, g)}
            className="nb-chip"
            style={fillStyle(value === g.name, color, darkText)}
          >
            {g.name}
          </button>
        ))}
      </div>
    </Field>
  );
}

export function MedListField({ field, value, onChange, color, darkText }) {
  const [looking, setLooking] = useState(false);
  const taken = value || [];

  return (
    <Field label={field.label} span>
      {taken.length === 0 && !looking && (
        <p className="text-sm text-muted-foreground">Pick a group, or add a medicine.</p>
      )}
      <div className="space-y-1.5">
        {taken.map((m, i) => (
          <div key={`${m.name}-${i}`} className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => onChange(taken.map((x, j) => (j === i ? { ...x, skipped: !x.skipped } : x)))}
              aria-pressed={!m.skipped}
              className="flex-1 min-w-0 flex items-center gap-2 border-2 rounded-xl px-2.5 py-2 text-left"
              style={m.skipped ? {} : fillStyle(true, color, darkText)}
            >
              <span className="flex-1 min-w-0 text-sm font-semibold break-words">
                {m.name}
                {m.dose && <span className="opacity-75">{"\u00a0· "}{m.dose}</span>}
              </span>
              <span className="nb-label shrink-0 opacity-75">{m.skipped ? "skipped" : "taken"}</span>
            </button>
            <button
              type="button"
              onClick={() => onChange(taken.filter((_, j) => j !== i))}
              className="nb-btn h-12 w-12 shrink-0 bg-card"
              aria-label={`Remove ${m.name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {looking ? (
        <DrugLookup
          onPick={(drug) => {
            onChange([...taken, { name: drug.name, rxcui: drug.rxcui }]);
            setLooking(false);
          }}
          onCancel={() => setLooking(false)}
        />
      ) : (
        <button type="button" onClick={() => setLooking(true)} className="nb-chip gap-1.5 bg-muted mt-1.5">
          <Plus className="w-3.5 h-3.5" /> Add a medicine
        </button>
      )}
    </Field>
  );
}
