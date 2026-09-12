import React from "react";

// The two big toggle buttons from the design sketch: lime when on, with an
// ON/OFF label on the right. These set the new surgery's track_before /
// track_after.
function ToggleRow({ on, onClick, label, hint }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="nb-btn w-full min-h-12 px-3 justify-between text-left gap-3"
      style={
        on
          ? { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }
          : {}
      }
    >
      <span className="min-w-0">
        <span className="block truncate uppercase">{label}</span>
        <span className="block text-[10px] font-semibold opacity-70 truncate uppercase">{hint}</span>
      </span>
      <span className="font-heading text-xs shrink-0">{on ? "ON" : "OFF"}</span>
    </button>
  );
}

function ChoiceChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="nb-chip flex-1 justify-center min-h-12 text-center"
      style={active ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : {}}
    >
      {label}
    </button>
  );
}

// Item 1: surgery vs maintenance. Choosing surgery reveals the two tracking
// toggles, then "Take me there" carries them to the new-surgery modal.
export default function SurgeryChoice({ state, setState, onTakeMeThere }) {
  const toggle = (k) => setState({ ...state, [k]: state[k] === false ? true : false });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <ChoiceChip
          active={state.choice === "surgery"}
          onClick={() => setState({ ...state, choice: "surgery" })}
          label="Upcoming surgery"
        />
        <ChoiceChip
          active={state.choice === "maintenance"}
          onClick={() => setState({ ...state, choice: "maintenance" })}
          label="Maintenance"
        />
      </div>

      {state.choice === "surgery" && (
        <div className="space-y-2">
          <ToggleRow
            on={state.track_before !== false}
            onClick={() => toggle("track_before")}
            label="Track days before surgery"
            hint="Log a baseline in the run-up."
          />
          <ToggleRow
            on={state.track_after !== false}
            onClick={() => toggle("track_after")}
            label="Track days from surgery onwards"
            hint="The recovery itself."
          />
          <button
            type="button"
            className="nb-btn w-full h-12 bg-primary text-primary-foreground"
            onClick={() => onTakeMeThere("surgery")}
          >
            Add your surgery
          </button>
        </div>
      )}

      {state.choice === "maintenance" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground break-words">
            You can log everything by date, with no surgery day to count from.
          </p>
          <button
            type="button"
            className="nb-btn w-full h-12 bg-primary text-primary-foreground"
            onClick={() => onTakeMeThere("maintenance")}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}