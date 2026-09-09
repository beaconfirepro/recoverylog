import React, { useState } from "react";
import Field from "@/components/Field";
import { MARKS, SILHOUETTE } from "@/lib/bodyMap";

export default function BodyMap({ field, value, onChange, color, darkText }) {
  const [side, setSide] = useState("front");
  const selected = Array.isArray(value) ? value : [];
  const marks = MARKS[side];

  const toggle = (part) =>
    onChange(selected.includes(part) ? selected.filter((p) => p !== part) : [...selected, part]);

  return (
    <Field label={field.label} hint="tap where it is" span>
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
        <svg viewBox="0 0 200 470" className="h-80 w-auto" role="group" aria-label={`${side} of body`}>
          <path d={SILHOUETTE} fill="hsl(var(--card))" stroke="currentColor" strokeWidth="3" />
          {Object.entries(marks).map(([part, [x, y]]) => {
            const on = selected.includes(part);
            return (
              // Two circles: the one you see, and a bigger clear one you can
              // actually hit with a thumb. Forty marks on one silhouette means
              // the drawn dot is smaller than a fingertip.
              <g key={part}>
                <circle
                  cx={x}
                  cy={y}
                  r="8.5"
                  fill={on ? color : "hsl(var(--card))"}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  pointerEvents="none"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => toggle(part)}
                  role="checkbox"
                  aria-checked={on}
                  aria-label={part}
                />
              </g>
            );
          })}
        </svg>
      </div>

    </Field>
  );
}
