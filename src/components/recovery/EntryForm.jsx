import React, { useState } from "react";
import { TYPES, PINNED, checkinConfig, checkinSlots, defaultSlot } from "@/lib/recovery";
import { usePatient } from "@/lib/PatientContext";
import { useLibrary } from "@/lib/library";
import { nowTime } from "@/lib/dates";
import {
  ScaleField, ChipsField, ChipsMultiField, NumberField, DurationField, TextField,
  TimeField, FileField, NoteField, Scale5Field, HungerField, BristolField,
  SwatchField, AreaSymptomsField, IncisionsField, MeasurementsField,
  NutrientsField, GarmentField, MedGroupField, MedListField
} from "./Fields";
import BodyMap from "./BodyMap";
import CheckinStack from "./CheckinStack";

export default function EntryForm({ type, entry, onSave, onCancel, onDelete, saving }) {
  const { activeSurgery } = usePatient();
  const garments = useLibrary("Garment");
  const medGroups = useLibrary("MedGroup");
  // The check-in is the one type a surgery reshapes: how often it asks and
  // what it records. Every other type is the same for everyone.
  const cfg = type === PINNED ? checkinConfig(activeSurgery) : TYPES[type];
  const [time, setTime] = useState(entry?.entry_time || nowTime());
  const [data, setData] = useState(() => {
    const base = { ...(entry?.data || {}) };
    if (!entry) {
      if (type === PINNED) base.slot = base.slot || defaultSlot(checkinSlots(activeSurgery));
      if (type === "rest") base.state = base.state || "Sleeping";
      if (type === "movement") base.kind = base.kind || "Walk";
      if (type === "compression") base.action = base.action || "on";
      if (type === "urine") base.clarity = base.clarity || "Clear";
    }
    return base;
  });
  const [note, setNote] = useState(entry?.note || "");

  const setField = (key, val) => setData((prev) => ({ ...prev, [key]: val }));

  const props = { color: cfg.color, darkText: !!cfg.darkText };
  // The parts marked on the map decide which per-area questions exist at all,
  // so they are read here rather than passed down through every field.
  const areas = Array.isArray(data.areas) ? data.areas : [];

  const header = (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="flex items-center justify-center w-10 h-10 shrink-0 border-2 rounded-xl"
        style={{ backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" }}
      >
        <cfg.icon className="w-5 h-5" />
      </span>
      <h2 className="font-heading text-lg uppercase tracking-wide truncate">{cfg.label}</h2>
    </div>
  );

  // The check-in asks one thing per screen; every other type is a single form.
  if (type === PINNED) {
    return (
      <div className="min-w-0 space-y-3">
        {header}
        <CheckinStack
          cfg={cfg}
          data={data}
          setField={setField}
          time={time}
          setTime={setTime}
          note={note}
          setNote={setNote}
          onSave={onSave}
          onCancel={onCancel}
          onDelete={onDelete}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 min-w-0">
      <div className="col-span-2">{header}</div>

      <TimeField label="Time" value={time} onChange={setTime} span />

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
          case "duration":
            return <DurationField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "text":
            return <TextField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "time":
            return <TimeField key={f.key} label={f.label} value={data[f.key] || ""} onChange={(v) => setField(f.key, v)} span />;
          case "scale5":
            return <Scale5Field key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "hunger":
            return <HungerField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "bristol":
            return <BristolField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "swatch":
            return <SwatchField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "bodymap":
            return <BodyMap key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "areaSymptoms":
            return <AreaSymptomsField key={f.key} field={f} areas={areas} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "incisions":
            return <IncisionsField key={f.key} field={f} areas={areas} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "measurements":
            return <MeasurementsField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "nutrients":
            return <NutrientsField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          case "garment":
            return (
              <GarmentField
                key={f.key}
                field={f}
                value={data[f.key]}
                onChange={(v) => setField(f.key, v)}
                garments={garments.rows}
                onAddGarment={garments.add}
                {...props}
              />
            );
          case "medGroup":
            return (
              <MedGroupField
                key={f.key}
                field={f}
                value={data[f.key]}
                // Picking a group brings its medicines up already ticked;
                // unpicking it clears them, so the list always belongs to the
                // group on screen rather than to one chosen a moment ago.
                onChange={(v, group) =>
                  setData((prev) => ({
                    ...prev,
                    group: v,
                    taken: v ? (group.medicines || []).map((m) => ({ name: m.name, dose: m.dose })) : []
                  }))
                }
                groups={medGroups.rows}
                {...props}
              />
            );
          case "medList":
            return <MedListField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} {...props} />;
          case "file":
            return <FileField key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />;
          default:
            return null;
        }
      })}

      <NoteField value={note} onChange={setNote} />

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