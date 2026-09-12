import React from "react";
import { recordLabel } from "@/lib/scope";

// A compact select for the record new entries attach to on a multi-record day,
// and whose day row (red flags, questions) is shown. Single-record scope never
// renders this: there is nothing to choose.
export default function RecordPicker({ records, value, onChange }) {
  if (!records || records.length <= 1) return null;
  return (
    <div className="space-y-1.5">
      <label htmlFor="record-picker" className="nb-label">Logging to</label>
      <select
        id="record-picker"
        className="nb-select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {records.map((r) => (
          <option key={r.id} value={r.id}>
            {recordLabel(r)}
          </option>
        ))}
      </select>
    </div>
  );
}