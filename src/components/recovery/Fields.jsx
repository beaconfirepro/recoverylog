import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Clock, Loader2, Minus, Plus, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Field from "@/components/Field";
import { nowTime } from "@/lib/dates";
import DrugLookup from "./DrugLookup";
import { BRISTOL, HUNGER_COLORS, HUNGER_LEVELS, NUTRIENTS, gradeColor, nutrientUnit } from "@/lib/recovery";

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
// picture here too: seven drawn types, the words underneath the one you pick.
const BRISTOL_ART = [
  <g key="1">{[30, 50, 70, 90].map((x) => <circle key={x} cx={x} cy="20" r="7" />)}</g>,
  <g key="2"><rect x="20" y="10" width="80" height="20" rx="10" />{[38, 56, 74].map((x) => <rect key={x} x={x} y="8" width="4" height="24" fill="hsl(var(--card))" />)}</g>,
  <g key="3"><rect x="16" y="12" width="88" height="16" rx="8" />{[40, 62, 84].map((x) => <rect key={x} x={x} y="10" width="2.5" height="20" fill="hsl(var(--card))" />)}</g>,
  <g key="4"><rect x="14" y="13" width="92" height="14" rx="7" /></g>,
  <g key="5">{[28, 52, 76].map((x) => <ellipse key={x} cx={x} cy="20" rx="12" ry="8" />)}</g>,
  <g key="6"><path d="M16 24 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 q10 -12 20 0 v6 h-80 z" /></g>,
  <g key="7"><path d="M14 26 q14 -10 26 -2 q12 8 24 0 q12 -8 24 2 v4 h-74 z" /></g>
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
              className="w-full flex items-center gap-2.5 border-2 rounded-xl p-2 text-left"
              style={on ? { backgroundColor: color, color: "#fff" } : {}}
            >
              <span className="font-heading text-sm w-4 shrink-0">{n}</span>
              <svg viewBox="0 0 120 40" className="h-8 w-24 shrink-0" fill={on ? "#fff" : "currentColor"} aria-hidden="true">
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

// Symptoms hang off the parts already marked on the map, so the question is
// never asked about a part that was not selected.
export function AreaSymptomsField({ field, areas, value, onChange, color, darkText }) {
  const findings = value || {};
  if (!areas.length) {
    return (
      <div className="col-span-2 min-w-0">
        <p className="text-sm text-muted-foreground">Mark a part on the body above and its symptoms appear here.</p>
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

// One severity per marked incision, in the order they get worse.
export function AreaStatusField({ field, areas, value, onChange, color, darkText }) {
  const status = value || {};
  if (!areas.length) {
    return (
      <div className="col-span-2 min-w-0">
        <p className="text-sm text-muted-foreground">Mark an incision on the body above and it appears here.</p>
      </div>
    );
  }
  return (
    <Field label={field.label} span>
      <div className="space-y-2">
        {areas.map((area) => (
          <div key={area} className="border-2 rounded-xl bg-card p-2.5">
            <div className="nb-label mb-1.5">{area}</div>
            <div className="flex flex-wrap gap-1.5">
              {field.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange({ ...status, [area]: status[area] === opt ? undefined : opt })}
                  className="nb-chip"
                  style={status[area] === opt ? fillStyle(true, color, darkText) : {}}
                >
                  {opt}
                </button>
              ))}
            </div>
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
    <Field label={field.label} hint="fill in the ones you are counting" span>
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
        <p className="text-sm text-muted-foreground">No garments yet — add one and it will be here every day.</p>
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
            placeholder="size"
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
    <Field label={field.label} hint="set the groups up in your profile" span>
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">No med groups yet — add one in your profile and it will be here.</p>
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
        <p className="text-sm text-muted-foreground">Pick a group above, or add a medicine on its own.</p>
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
