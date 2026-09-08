import React, { useState } from "react";
import Field from "@/components/Field";

// One silhouette, drawn once and reused by every tracker that asks where. The
// path is a closed outline in a 200 × 470 box, so the marks below can be placed
// in the same coordinates whatever size it renders at.
const SILHOUETTE =
  "M 100 12 C 120 12 132 26 132 46 C 132 66 122 78 113 82 C 113 88 114 93 117 97 " +
  "C 133 103 150 113 157 130 C 165 154 171 182 173 212 C 176 234 172 250 164 250 " +
  "C 157 250 156 236 154 214 C 150 184 145 158 139 144 C 137 170 135 194 135 216 " +
  "C 135 244 139 268 137 296 C 136 338 132 390 128 436 C 127 450 120 456 113 453 " +
  "C 107 450 108 442 108 432 C 108 388 106 344 102 308 C 101 304 100 302 100 300 " +
  "C 100 302 99 304 98 308 C 94 344 92 388 92 432 C 92 442 93 450 87 453 " +
  "C 80 456 73 450 72 436 C 68 390 64 338 63 296 C 61 268 65 244 65 216 " +
  "C 65 194 63 170 61 144 C 55 158 50 184 46 214 C 44 236 43 250 36 250 " +
  "C 28 250 24 234 27 212 C 29 182 35 154 43 130 C 50 113 67 103 83 97 " +
  "C 86 93 87 88 87 82 C 78 78 68 66 68 46 C 68 26 80 12 100 12 Z";

// Left and right are the patient's, so on the front view her left sits on the
// right of the drawing. Getting this backwards would put a finding on the wrong
// leg in a record a surgeon reads.
const MARKS = {
  front: {
    Neck: [100, 88], Chest: [100, 128], Abdomen: [100, 190],
    "Left flank": [130, 178], "Right flank": [70, 178], Hips: [100, 242],
    "Left thigh": [118, 305], "Right thigh": [82, 305],
    "Left calf": [114, 398], "Right calf": [86, 398],
    "Left arm": [156, 195], "Right arm": [44, 195]
  },
  back: {
    Neck: [100, 88], "Upper back": [100, 135], "Lower back": [100, 205], Hips: [100, 250],
    "Left thigh": [82, 305], "Right thigh": [118, 305],
    "Left calf": [86, 398], "Right calf": [114, 398],
    "Left arm": [44, 195], "Right arm": [156, 195]
  }
};

export default function BodyMap({ field, value, onChange, color, darkText }) {
  const [side, setSide] = useState("front");
  const selected = Array.isArray(value) ? value : [];
  const marks = MARKS[side];

  const toggle = (part) =>
    onChange(selected.includes(part) ? selected.filter((p) => p !== part) : [...selected, part]);

  return (
    <Field label={field.label} hint="tap the body or pick from the list" span>
      <div className="flex gap-2">
        {["front", "back"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`nb-chip flex-1 justify-center ${side === s ? "bg-foreground text-background" : ""}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border-2 rounded-xl bg-muted p-2 flex justify-center">
        <svg viewBox="0 0 200 470" className="h-64 w-auto" role="group" aria-label={`${side} of body`}>
          <path d={SILHOUETTE} fill="hsl(var(--card))" stroke="currentColor" strokeWidth="3" />
          {Object.entries(marks).map(([part, [x, y]]) => {
            const on = selected.includes(part);
            return (
              <circle
                key={part}
                cx={x}
                cy={y}
                r="11"
                fill={on ? color : "hsl(var(--card))"}
                stroke="currentColor"
                strokeWidth="2.5"
                className="cursor-pointer"
                onClick={() => toggle(part)}
                role="checkbox"
                aria-checked={on}
                aria-label={part}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1.5">
        {Object.keys(marks).map((part) => {
          const on = selected.includes(part);
          return (
            <button
              key={part}
              type="button"
              onClick={() => toggle(part)}
              className="nb-chip"
              style={on ? { backgroundColor: color, color: darkText ? "#1A1024" : "#fff" } : {}}
            >
              {part}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
