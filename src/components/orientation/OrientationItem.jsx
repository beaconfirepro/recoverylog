import React from "react";
import { Check } from "lucide-react";
import SurgeryChoice from "@/components/orientation/SurgeryChoice";

function YesNo({ onYes, onNo, yesCta }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="nb-btn flex-1 min-w-0 h-11 bg-primary text-primary-foreground"
        onClick={onYes}
      >
        {yesCta || "Yes"}
      </button>
      <button type="button" className="nb-btn flex-1 min-w-0 h-11 bg-card" onClick={onNo}>
        No
      </button>
    </div>
  );
}

export default function OrientationItem({ item, state, setState, onNavigate }) {
  const done = !!state.items[item.key];

  const mark = (val) => setState({ ...state, items: { ...state.items, [item.key]: val } });

  return (
    <div className="border-2 rounded-xl bg-card p-3 space-y-2 min-w-0">
      <div className="flex items-start gap-2 min-w-0">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark step ${item.n} complete`}
          onClick={() => mark(!done)}
          className="w-7 h-7 shrink-0 border-2 rounded-md grid place-items-center mt-0.5"
          style={done ? { backgroundColor: "hsl(var(--accent))" } : {}}
        >
          {done && <Check className="w-5 h-5" strokeWidth={3.5} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="nb-label text-muted-foreground">Step {item.n}</div>
          <div className="text-sm font-bold break-words">{item.question}</div>
        </div>
      </div>

      {item.body && <p className="text-xs font-semibold text-muted-foreground break-words">{item.body}</p>}

      {item.kind === "surgery" && (
        <SurgeryChoice
          state={state}
          setState={setState}
          onTakeMeThere={(choice) => onNavigate(item, choice)}
        />
      )}

      {item.kind === "yesno" && (
        <YesNo
          yesCta={item.yes?.cta}
          onYes={() => onNavigate(item, "yes")}
          onNo={() => mark(true)}
        />
      )}

      {item.kind === "nav" && (
        <button
          type="button"
          className="nb-btn w-full h-11 bg-card"
          onClick={() => onNavigate(item)}
        >
          {item.cta}
        </button>
      )}
    </div>
  );
}