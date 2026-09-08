import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useLibrary } from "@/lib/library";
import DrugLookup from "./DrugLookup";

const Card = ({ title, blurb, children }) => (
  <div className="nb-card overflow-hidden">
    <div className="px-4 py-3 border-b-2 bg-muted">
      <div className="font-display text-xl uppercase leading-tight break-words">{title}</div>
      <div className="text-sm font-semibold break-words">{blurb}</div>
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

// Named once here, offered on the Compression tracker for the rest of the
// recovery. Sizes live with the name because that is what she checks against.
export function GarmentLibrary() {
  const { rows, add, remove } = useLibrary("Garment");
  const [name, setName] = useState("");
  const [size, setSize] = useState("");

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    setName("");
    setSize("");
    await add({ name: n, size: size.trim() });
  };

  return (
    <Card title="My garments" blurb="The Compression tracker offers these instead of asking you to type one.">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
      <div className="space-y-1.5">
        {rows.map((g) => (
          <div key={g.id} className="flex items-center gap-2 min-w-0">
            <span className="flex-1 min-w-0 truncate text-sm font-bold">{g.name}</span>
            {g.size && <span className="nb-chip shrink-0 bg-muted">{g.size}</span>}
            <button
              type="button"
              onClick={() => remove(g.id)}
              className="nb-btn h-11 w-11 shrink-0 bg-card"
              aria-label={`Remove ${g.name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), save())}
          placeholder="e.g. Marena stage 1"
          className="nb-input"
        />
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="size"
          className="nb-input w-20 shrink-0"
        />
        <button type="button" onClick={save} className="nb-btn h-12 px-4 shrink-0 bg-accent text-accent-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}

// Reason is asked here and never again: on the entry itself it is the same
// answer every time, which makes it noise rather than a question.
function MedRow({ med, onChange, onRemove }) {
  // Typed locally and saved when the field is left, so setting a dose is one
  // write rather than one per letter.
  const [draft, setDraft] = useState(med);
  const commit = () => draft !== med && onChange(draft);
  return (
    <div className="border-2 rounded-xl bg-background p-2 space-y-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-1 min-w-0 text-sm font-bold break-words">{med.name}</span>
        <button type="button" onClick={onRemove} className="nb-btn h-10 w-10 shrink-0 bg-card" aria-label={`Remove ${med.name}`}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={draft.dose || ""}
          onChange={(e) => setDraft({ ...draft, dose: e.target.value })}
          onBlur={commit}
          placeholder="dose — e.g. 1 capsule"
          className="nb-input"
        />
        <input
          type="text"
          value={draft.reason || ""}
          onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
          onBlur={commit}
          placeholder="reason"
          className="nb-input"
        />
      </div>
    </div>
  );
}

function Group({ group, update, remove }) {
  const [looking, setLooking] = useState(false);
  const meds = group.medicines || [];
  const setMeds = (next) => update(group.id, { medicines: next });

  return (
    <div className="border-2 rounded-xl bg-card p-3 space-y-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-1 min-w-0 nb-label">{group.name}</span>
        <button
          type="button"
          onClick={() => remove(group.id)}
          className="nb-btn h-10 px-3 shrink-0 bg-card"
        >
          Delete group
        </button>
      </div>

      {meds.length === 0 && !looking && <p className="text-sm text-muted-foreground">No medicines in this group yet.</p>}

      <div className="space-y-1.5">
        {meds.map((m, i) => (
          <MedRow
            key={`${m.name}-${i}`}
            med={m}
            onChange={(next) => setMeds(meds.map((x, j) => (j === i ? next : x)))}
            onRemove={() => setMeds(meds.filter((_, j) => j !== i))}
          />
        ))}
      </div>

      {looking ? (
        <DrugLookup
          onPick={(drug) => {
            setMeds([...meds, { name: drug.name, rxcui: drug.rxcui }]);
            setLooking(false);
          }}
          onCancel={() => setLooking(false)}
        />
      ) : (
        <button type="button" onClick={() => setLooking(true)} className="nb-chip gap-1.5 bg-muted">
          <Plus className="w-3.5 h-3.5" /> Add a medicine
        </button>
      )}
    </div>
  );
}

export function MedGroupLibrary() {
  const { rows, add, update, remove } = useLibrary("MedGroup");
  const [name, setName] = useState("");

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    setName("");
    await add({ name: n, medicines: [] });
  };

  return (
    <Card
      title="My med groups"
      blurb="Pick a group on the Med tracker and everything in it comes up already ticked."
    >
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
      <div className="space-y-2">
        {rows.map((g) => (
          <Group key={g.id} group={g} update={update} remove={remove} />
        ))}
      </div>
      <div className="flex gap-2 min-w-0">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), save())}
          placeholder="e.g. AM Meds, PRN Pain"
          className="nb-input"
        />
        <button type="button" onClick={save} className="nb-btn h-12 px-4 shrink-0 bg-accent text-accent-foreground">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}
