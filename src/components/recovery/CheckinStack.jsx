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

// The scale was eleven buttons in a row: about 40pt wide and 36pt tall each,
// under the 44pt minimum, on the control a patient uses several times a day
// while medicated and sore. Dragging worked; the first tap was the problem.
//
// A slider fixes the target without losing what the old control got right —
// the face, the colour and the wording all read off wellbeing rather than the
// raw number, so 10 is bad for pain and good for mood. It also gains a real
// accessible name: the number was announced before, and the wording that makes
// the number answerable sat in a paragraph beside it where a screen reader
// never connected the two.
const STEPS = 11;

function ScaleCard({ field, value, onChange, note, onNoteChange }) {
  const [noteOpen, setNoteOpen] = useState(!!note);
  const track = useRef(null);
  const dragging = useRef(false);

  // Where a point on the track lands, snapped to a whole number. The notches
  // are what the thumb stops on, so this is the only reading of position.
  const valueAt = (clientX) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round(pct * (STEPS - 1));
  };

  const setFrom = (clientX) => {
    const n = valueAt(clientX);
    if (n != null && n !== value) onChange(n);
  };

  const shown = value == null ? 5 : value;
  const pct = (shown / (STEPS - 1)) * 100;
  const colour = value == null ? "hsl(var(--muted))" : gradeColor(field, value);
  // "Pain 7, worse than yesterday" rather than "Pain 7". The level wording is
  // the half that makes the number mean something.
  const valueText = value == null ? "not set" : `${value}${field.levels?.[value] ? `, ${field.levels[value]}` : ""}`;

  return (
    <div className="flex flex-col items-center">
      <div className="text-foreground">
        <Face w={value == null ? 5 : well(field, value)} color={colour} />
      </div>
      <h3 className="font-display text-3xl uppercase mt-2">{field.label}</h3>
      <p
        className="min-h-[3.5rem] mt-2 mb-3 max-w-[30ch] text-center text-base font-bold text-balance flex flex-col justify-center"
        aria-live="polite"
      >
        {value == null ? (
          <span className="font-semibold text-muted-foreground">Drag or tap the bar to set a level</span>
        ) : (
          <>
            <span className="font-heading text-2xs uppercase tracking-widest text-muted-foreground">
              {field.label} {value}
            </span>
            {field.levels?.[value]}
          </>
        )}
      </p>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={field.label}
        aria-valuemin={0}
        aria-valuemax={STEPS - 1}
        aria-valuenow={value == null ? undefined : value}
        aria-valuetext={valueText}
        className="relative w-full h-12 touch-none select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          setFrom(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFrom(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onKeyDown={(e) => {
          const from = value == null ? 0 : value;
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, from - 1));
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(STEPS - 1, from + 1));
          else if (e.key === "Home") onChange(0);
          else if (e.key === "End") onChange(STEPS - 1);
          else return;
          e.preventDefault();
        }}
      >
        {/* The line, with a notch at every whole number so the stops are
            visible rather than something you discover by feel. */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 border-2 rounded-full bg-card overflow-hidden">
          {value != null && (
            <div
              className="h-full transition-all duration-150 motion-reduce:transition-none"
              style={{ width: `${pct}%`, backgroundColor: colour }}
            />
          )}
        </div>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-[1px] pointer-events-none">
          {Array.from({ length: STEPS }, (_, n) => (
            <span key={n} className="w-0.5 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--foreground))", opacity: 0.35 }} />
          ))}
        </div>
        {/* 44pt, which is the whole point of replacing the eleven buttons. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 w-11 h-11 -ml-[1.375rem] -translate-y-1/2 border-2 rounded-full grid place-items-center font-heading text-sm transition-all duration-150 motion-reduce:transition-none"
          style={{
            left: `${pct}%`,
            backgroundColor: value == null ? "hsl(var(--card))" : colour,
            color: value == null ? "hsl(var(--muted-foreground))" : "#fff",
            boxShadow: "2px 2px 0 hsl(var(--foreground))"
          }}
        >
          {value == null ? "–" : value}
        </div>
      </div>

      <div className="w-full flex justify-between mt-1 font-heading text-2xs text-muted-foreground">
        <span>0</span>
        <span>10</span>
      </div>

      {/* A slider has no natural "unset", and the old control cleared by
          tapping the value again. Without this there is no way back to a
          measure she has not answered. */}
      {value != null && (
        <button
          type="button"
          className="nb-label mt-2 text-muted-foreground underline"
          onClick={() => onChange(undefined)}
        >
          Clear {field.label.toLowerCase()}
        </button>
      )}

      {noteOpen ? (
        <div className="w-full mt-3">
          <Field label={`${field.label} note`} span>
            <textarea
              className="nb-textarea min-h-[5rem]"
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Why?"
            />
          </Field>
        </div>
      ) : (
        <button
          type="button"
          className="nb-label flex items-center gap-1.5 text-muted-foreground mt-3 self-start"
          onClick={() => setNoteOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> Add a note
        </button>
      )}
    </div>
  );
}

// The check-in asks one thing per screen: the slot and time, then each measure
// the surgery records. There is no note screen at the end: every measure
// carries its own note, so a note with nothing attached to it has no place.
export default function CheckinStack({ cfg, data, setField, time, setTime, onSave, onCancel, onDelete, saving }) {
  const steps = cfg.fields;
  const [step, setStep] = useState(0);
  const [asking, setAsking] = useState(false);
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
          // The slider is a horizontal drag inside a horizontal swipe. Without
          // it named here, dragging pain from 2 to 8 would also flip to the
          // next measure — data-n was how the old eleven buttons were spotted
          // and it does not exist any more.
          swipeX.current = e.target.closest('[role="slider"], textarea, input, button') ? null : e.clientX;
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
      </div>

      {/* Everything waits on the write: a cancel mid-save takes the check-in off
          screen while it is still in flight, and a second tap on Delete asks
          the backend to remove a row it has already removed. */}
      <div className="flex gap-2 mt-4 min-w-0">
        <button
          className="nb-btn h-14 px-4 shrink-0 bg-card"
          onClick={() => (step === 0 ? onCancel() : go(step - 1))}
          disabled={saving}
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {last ? (
          <button
            className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground"
            onClick={() => onSave({ entry_time: time, data })}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : (
          <button className="nb-btn flex-1 min-w-0 h-14 bg-primary text-primary-foreground" onClick={() => go(step + 1)}>
            Next
          </button>
        )}
      </div>

      {/* Out of the row that holds Save. At the end of a swipe flow an
          irreversible button beside the one you are reaching for is the worst
          place it could be. */}
      {onDelete &&
        (asking ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-semibold break-words">
              This check-in goes for good, and it cannot be brought back.
            </p>
            <div className="flex gap-2 min-w-0">
              <button
                type="button"
                className="nb-btn flex-1 min-w-0 h-12 bg-destructive text-destructive-foreground"
                onClick={onDelete}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete for good"}
              </button>
              <button
                type="button"
                className="nb-btn h-12 px-4 shrink-0 bg-card"
                onClick={() => setAsking(false)}
                disabled={saving}
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full h-11 mt-3 font-heading text-xs uppercase tracking-wider text-destructive"
            onClick={() => setAsking(true)}
            disabled={saving}
          >
            Delete this check-in
          </button>
        ))}
    </div>
  );
}
