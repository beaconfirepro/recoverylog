import React, { useState } from "react";
import { TYPES, defaultSlot } from "@/lib/recovery";
import { nowTime } from "@/lib/dates";
import {
  ScaleField, ChipsField, ChipsMultiField, NumberField, TextField,
  TimeField, SpotsField, FileField
} from "./Fields";

export default function EntryForm({ type, entry, spots, onSave, onCancel, onDelete, saving }) {
  const cfg = TYPES[type];
  const [time, setTime] = useState(entry?.entry_time || nowTime());
  const [data, setData] = useState(() => {
    const base = { ...(entry?.data || {}) };
    if (!entry) {
      if (type === "checkin") base.slot = base.slot || defaultSlot();
      if (type === "sleep") base.kind = base.kind || "sleep";
      if (type === "movement") base.kind = base.kind || "walk";
      if (type === "garment") base.action = base.action || "on";
    }
    return base;
  });
  const [note, setNote] = useState(entry?.note || "");

  const setField = (key, val, kind) =>
    setData((prev) => (kind === "spots" ? { ...prev, ...val } : { ...prev, [key]: val }));

  const props = { color: cfg.color, darkText: !!cfg.darkText };

  return (
    <div className="grid grid-cols-2 gap-3 min-w-0">
      <div className="col-span-2 flex items-center gap-2 min-w-0">
        <span
          className="flex items-center justify-center w-10 h-10 shrink-0 border-2 rounded-xl"
          style={{ backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" }}
        >
          <cfg.icon className="w-5 h-5" />
        </span>
        <h2 className="font-heading text-lg uppercase tracking-wide truncate">{cfg.label}</h2>
      </div>

      <TimeField label="Time" value={time} onChange={setTime} />

      {cfg.fields.map((f) => {
        switch (f.kind) {
          case "scale":
            return <ScaleField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "chips":
            return <ChipsField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "chipsMulti":
            return <ChipsMultiField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "number":
            return <NumberField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "text":
            return <TextField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "time":
            return <TimeField key={f.key} label={f.label} value={data[f.key] || ""} onChange={(v) => setField(f.key, v)} />;
          case "spots":
            return <SpotsField key={f.key} field={f} value={data} onChange={(v) => setField(f.key, v, "spots")} spots={spots} />;
          case "file":
            return <FileField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          default:
            return null;
        }
      })}

      <TextField field={{ label: "Note", placeholder: "anything else?" }} value={note} onChange={setNote} />

      <div className="col-span-2 flex gap-2 min-w-0">
        <button
          className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground"
          onClick={() => onSave({ entry_time: time, data, note })}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="nb-btn h-14 px-4 shrink-0 bg-card" onClick={onCancel}>
          Cancel
        </button>
        {onDelete && (
          <button className="nb-btn h-14 px-4 shrink-0 bg-destructive text-destructive-foreground" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}