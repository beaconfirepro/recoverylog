import React, { useEffect, useRef, useState } from "react";
import { composeTime as compose, digits, pad, parseTime as parse } from "@/lib/clock";

// Hour, minutes, AM or PM. Three plain controls rather than the browser's own
// time field, which looks and behaves differently on every phone and cannot be
// styled to match anything around it.
//
// The value in and out is still 24-hour "HH:MM", so nothing that stores or
// reads a time has to change. The conversion itself lives in @/lib/clock, where
// it can be tested without a browser.

export default function TimeInput({ value, onChange, small, className = "" }) {
  const [h, setH] = useState(() => parse(value).h);
  const [m, setM] = useState(() => parse(value).m);
  const [pm, setPm] = useState(() => parse(value).pm);
  const minRef = useRef(null);

  // Re-read only when the value was changed by something other than us, so
  // typing is never fought halfway through a number.
  useEffect(() => {
    if (compose(h, m, pm) === (value || "")) return;
    const p = parse(value);
    setH(p.h);
    setM(p.m);
    setPm(p.pm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const push = (nh, nm, npm) => {
    const next = compose(nh, nm, npm);
    if (next !== (value || "")) onChange(next);
  };

  const box = small ? "h-9 w-11 text-sm" : "h-12 w-12 text-base";
  const chip = small ? "h-9 px-2 text-xs" : "h-12 px-2.5 text-sm";

  return (
    <div className={`flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Hour"
        placeholder="--"
        value={h}
        onChange={(e) => {
          let v = digits(e.target.value, 2);
          // Clamp while typing rather than on blur. Moving focus below fires
          // blur mid-change, so a blur handler would be working from the
          // previous render's value.
          if (v.length === 2 && Number(v) > 12) v = "12";
          setH(v);
          push(v, m, pm);
          // Two digits, or a number that cannot take another, moves on.
          if (v.length === 2 || Number(v) > 1) minRef.current?.focus();
        }}
        onBlur={(e) => {
          const raw = digits(e.target.value, 2);
          if (raw === "") return;
          const n = Math.min(12, Math.max(1, Number(raw)));
          setH(String(n));
          push(String(n), m, pm);
        }}
        className={`nb-input shrink-0 text-center px-0 ${box}`}
      />
      <span className="font-heading font-bold shrink-0">:</span>
      <input
        ref={minRef}
        type="text"
        inputMode="numeric"
        aria-label="Minutes"
        placeholder="--"
        value={m}
        onChange={(e) => {
          let v = digits(e.target.value, 2);
          if (v.length === 2 && Number(v) > 59) v = "59";
          setM(v);
          push(h, v, pm);
        }}
        onBlur={(e) => {
          const raw = digits(e.target.value, 2);
          if (raw === "") return;
          const n = Math.min(59, Math.max(0, Number(raw)));
          setM(pad(n));
          push(h, pad(n), pm);
        }}
        className={`nb-input shrink-0 text-center px-0 ${box}`}
      />
      <div className="flex gap-1 shrink-0">
        {[false, true].map((isPm) => (
          <button
            key={String(isPm)}
            type="button"
            aria-pressed={pm === isPm}
            onClick={() => {
              setPm(isPm);
              push(h, m, isPm);
            }}
            className={`nb-chip font-heading ${chip}`}
            style={pm === isPm ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" } : {}}
          >
            {isPm ? "PM" : "AM"}
          </button>
        ))}
      </div>
    </div>
  );
}
