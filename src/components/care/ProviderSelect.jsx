import React, { useState } from "react";
import { useCareTeam } from "@/lib/careTeam";
import { displayName } from "@/lib/PatientContext";
import Field from "@/components/Field";

// A provider picker for the appointment forms. Offers the care team members as
// a dropdown, with an "Add new" option that falls back to a typed name. Picking
// a member carries their provider type across so the Type field fills itself.
//
// onChange receives a patch — { provider_name } when only the name changed, or
// { provider_name, provider_type } when a member was picked and their type
// should land too.
export default function ProviderSelect({ value, onChange }) {
  const { team } = useCareTeam();
  const members = team.map((m) => ({
    id: m.id,
    name: displayName(m) || m.email,
    provider_type: m.provider_type
  }));
  const matched = members.find((m) => m.name === value);
  // Start in typed-name mode when the current value is not a team member (an
  // edit of an older appointment, or a fresh add with no team yet).
  const [addingNew, setAddingNew] = useState(!matched && !!value);

  const pick = (name) => {
    if (name === "__new") {
      setAddingNew(true);
      onChange({ provider_name: "", provider_type: "" });
      return;
    }
    setAddingNew(false);
    const m = members.find((x) => x.name === name);
    onChange({ provider_name: name, provider_type: m?.provider_type || "" });
  };

  if (addingNew) {
    return (
      <Field label="Provider name" span>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange({ provider_name: e.target.value })}
            placeholder="Dr. Smith"
            className="nb-input"
          />
          {members.length > 0 && (
            <button
              type="button"
              className="nb-btn h-12 px-3 shrink-0 bg-card text-xs"
              onClick={() => { setAddingNew(false); onChange({ provider_name: "", provider_type: "" }); }}
            >
              List
            </button>
          )}
        </div>
      </Field>
    );
  }

  return (
    <Field label="Provider" span>
      <select
        value={matched ? matched.name : ""}
        onChange={(e) => pick(e.target.value)}
        className="nb-select"
      >
        <option value="">Select a provider</option>
        {members.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}{m.provider_type ? ` · ${m.provider_type}` : ""}
          </option>
        ))}
        <option value="__new">Add new provider…</option>
      </select>
    </Field>
  );
}