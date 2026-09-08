import React, { useRef, useState } from "react";
import { Plus } from "lucide-react";
import Field from "@/components/Field";
import { ChipsField, TextField, TimeField } from "./Fields";
import { gradeColor as grade } from "@/lib/recovery";

// Each measure carries its own note alongside its number, so "pain 8" can say
// why. Kept on the entry data under the measure it belongs to.
export const noteKey = (fieldKey) => `${fieldKey}_note`;

// Wellbeing, not the raw number: 10 is bad for pain and good for mood, so the
// face and the colour read off this instead of the value itself.
const well = (field, v) => (field.highIs === "bad" ? 10 - v : v);
const gradeColor = (field, v) => grade(well(field, v), 10, "good");

// Drawn rather than picked from a set of emoji: the mouth, the brows and the
// eyes all interpolate off wellbeing, so all eleven levels get their own face.
function Face({ w, color, size = 128 }) {
  const mouthY = 58 + (w / 10 - 0.5) * 40;
  const brow = (0.5 - w / 10) * 14;
  const eyeR = 5 + (w / 10) * 1.5;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill={color} stroke="currentColor" strokeWidth="4" />
      <circle cx="35" cy="43" r={eyeR} fill="currentColor" />
      <circle cx="65" cy="43" r={eyeR} fill="currentColor" />
      <line x1="27" y1={30 - brow} x2="43" y2={30 + brow} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="57" y1={30 + brow} x2="73" y2={30 - brow} stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d={`M 32 62 Q 50 ${mouthY} 68 62`} fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function ScaleCard({ field, value, onChange, note, onNoteChange }) {
  const dragging = useRef(false);
  const [noteOpen, setNoteOpen] = useState(!!note);
  const set = (n) => {
    if (!Number.isNaN(n) && value !== n) onChange(n);
  };
  return (
    <div className="flex flex-col items-center">
      <div className="text-foreground">
        <Face w={value == null ? 5 : well(field, value)} color={value == null ? "hsl(var(--muted))" : gradeColor(field, value)} />
      </div>
      <h3 className="font-display text-3xl uppercase mt-2">{field.label}</h3>
      <p className="min-h-[3.5rem] mt-2 mb-3 max-w-[30ch] text-center text-base font-bold text-balance flex flex-col justify-center">
        {value == null ? (
          <span className="font-semibold text-muted-foreground">Drag the bar to set a level</span>
        ) : (
          <>
            <span className="font-heading text-[11px] uppercase tracking-widest text-muted-foreground">
              {field.label} {value}
            </span>
            {field.levels?.[value]}
          </>
        )}
      </p>
      <div
        className="w-full flex items-end gap-[3px] h-16 touch-none"
        onPointerDown={(e) => {
          const n = Number(e.target.dataset.n);
          if (e.target.dataset.n === undefined) return;
          // Capture on the bar itself so the release always lands here; without
          // it a pointer let go off the bar leaves the drag flag stuck on.
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          onChange(value === n ? undefined : n);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el?.dataset?.n !== undefined) set(Number(el.dataset.n));
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            type="button"
            data-n={n}
            aria-label={`${field.label} ${n}`}
            aria-pressed={value === n}
            className={`flex-1 min-w-0 border-2 rounded-lg font-heading text-[11px] transition-all duration-200 motion-reduce:transition-none ${
              value === n ? "h-16 text-white" : "h-9 bg-card text-muted-foreground"
            }`}
            style={value === n ? { backgroundColor: gradeColor(field, n) } : undefined}
          >
            {n}
          </button>
        ))}
      </div>

      {noteOpen ? (
        <div className="w-full mt-3">
          <Field label={`${field.label} note`} span>
            <textarea
              className="nb-textarea min-h-[5rem]"
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={`what made ${field.label.toLowerCase()} this today?`}
            />
          </Field>
        </div>
      ) : (
        <button
          type="button"
          className="nb-label flex items-center gap-1.5 text-muted-foreground mt-3 self-start"
          onClick={() => setNoteOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add a note about {field.label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

// The check-in asks one thing per screen: the slot and time, then each measure
// the surgery records, then a note. Everything else in the app stays a form.
export default function CheckinStack({ cfg, data, setField, time, setTime, note, setNote, onSave, onCancel, onDelete, saving }) {
  const steps = [...cfg.fields, { key: "note", kind: "note", label: "Note" }];
  const [step, setStep] = useState(0);
  const swipeX = useRef(null);
  const current = steps[step];
  const last = step === steps.length - 1;

  const go = (n) => setStep(Math.min(steps.length - 1, Math.max(0, n)));

  return (
    <div className="min-w-0">
      <div className="flex gap-[5px] mb-4">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={`flex-1 h-1.5 border-2 rounded-full ${i < step ? "bg-secondary" : i === step ? "bg-primary" : "bg-card"}`}
          />
        ))}
      </div>

      {/* A fixed floor under the step so the nav row does not jump as the
          screens change height inside the dialog. */}
      <div
        className="min-h-[21rem]"
        onPointerDown={(e) => {
          swipeX.current = e.target.closest("[data-n], textarea, input, button") ? null : e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeX.current == null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) >= 55) go(step + (dx < 0 ? 1 : -1));
        }}
      >
        {current.kind === "scale" && (
          <ScaleCard
            // Keyed by measure so the note panel's open state belongs to the
            // measure, not to the slot on screen it happens to occupy.
            key={current.key}
            field={current}
            value={data[current.key]}
            onChange={(v) => setField(current.key, v)}
            note={data[noteKey(current.key)]}
            onNoteChange={(v) => setField(noteKey(current.key), v)}
          />
        )}

        {current.kind === "chips" && (
          <div className="grid grid-cols-2 gap-3">
            <ChipsField field={current} value={data[current.key]} onChange={(v) => setField(current.key, v)} color={cfg.color} />
            <TimeField label="Time" value={time} onChange={setTime} span />
          </div>
        )}

        {current.kind === "text" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField field={current} value={data[current.key]} onChange={(v) => setField(current.key, v)} />
          </div>
        )}

        {current.kind === "note" && (
          <Field label="Note" hint="anything the numbers miss" span>
            <textarea
              className="nb-textarea min-h-[8rem]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. slept badly, left side much tighter than yesterday"
            />
          </Field>
        )}
      </div>

      <div className="flex gap-2 mt-4 min-w-0">
        <button className="nb-btn h-14 px-4 shrink-0 bg-card" onClick={() => (step === 0 ? onCancel() : go(step - 1))}>
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {last ? (
          <button
            className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground"
            onClick={() => onSave({ entry_time: time, data, note })}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : (
          <button className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground" onClick={() => go(step + 1)}>
            Next
          </button>
        )}
        {onDelete && (
          <button className="nb-btn h-14 px-4 shrink-0 bg-destructive text-destructive-foreground" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
