import React, { useState } from "react";
import { usePatient, displayName } from "@/lib/PatientContext";
import { useCareTeam } from "@/lib/careTeam";
import Field from "@/components/Field";

// An assignee picker for task forms. Offers the patient and the care team
// members as a dropdown, with an "Add new" option that falls back to a typed
// name. onChange always receives a real name.
export default function AssigneeSelect({ value, onChange }) {
  const { patient } = usePatient();
  const { team } = useCareTeam();
  const patientName = displayName(patient) || "Patient";
  const members = team.map((m) => displayName(m) || m.email);
  const matched = value === patientName || members.includes(value);
  const [addingNew, setAddingNew] = useState(!!value && !matched);

  const pick = (name) => {
    if (name === "__new") {
      setAddingNew(true);
      onChange("");
      return;
    }
    setAddingNew(false);
    onChange(name);
  };

  if (addingNew) {
    return (
      <Field label="Assign to" span>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Name"
            className="nb-input"
          />
          <button
            type="button"
            className="nb-btn h-12 px-3 shrink-0 bg-card text-xs"
            onClick={() => { setAddingNew(false); onChange(patientName); }}
          >
            List
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="Assign to" span>
      <select
        value={matched ? value : patientName}
        onChange={(e) => pick(e.target.value)}
        className="nb-select"
      >
        <option value={patientName}>{patientName}</option>
        {members.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
        <option value="__new">Add new…</option>
      </select>
    </Field>
  );
}