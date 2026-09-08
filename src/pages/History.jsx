import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { niceDate, postOpLabel } from "@/lib/dates";
import { computeTotals, redFlagYesCount } from "@/lib/daySummary";
import { TYPES, entryNotes } from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient } from "@/lib/PatientContext";

// A tracker with a real total says the total; the rest say how many times it
// was logged, which is the only honest summary of a list of events.
const summaryFor = (type, t, count) => {
  if (type === "water") return `${t.water} oz`;
  if (type === "nutrients") return `${t.protein} g protein`;
  if (type === "rest") return `${(t.sleepH + t.napH).toFixed(1)} h`;
  if (type === "compression") return `${(t.garmentMin / 60).toFixed(1)} h`;
  if (type === "weight") return t.weight != null ? `${t.weight} lbs` : "—";
  if (type === "temp") return t.tempPm != null ? `${t.tempPm}°F` : "—";
  return `×${count}`;
};

export default function History() {
  const { activeSurgery, activeSurgeryId } = usePatient();
  const [days, setDays] = useState(null);
  const [totalsByDay, setTotalsByDay] = useState(null);
  const [notesByDay, setNotesByDay] = useState({});
  const [surgeryDate, setSurgeryDate] = useState(null);
  const [countsByDay, setCountsByDay] = useState({});

  useEffect(() => {
    const run = async () => {
      if (!activeSurgeryId) {
        setDays([]);
        setTotalsByDay({});
        setNotesByDay({});
        return;
      }
      const [dsRaw, entriesRaw] = await Promise.all([
        base44.entities.RecoveryDay.filter({ surgery_id: activeSurgeryId }, "-date", 200),
        base44.entities.RecoveryEntry.filter({ surgery_id: activeSurgeryId }, "created_date", 3000)
      ]);
      const [ds, entries] = [asRows(dsRaw), asRows(entriesRaw)];
      const byDate = {};
      entries.forEach((e) => {
        (byDate[e.date] = byDate[e.date] || []).push(e);
      });
      const totals = {};
      const notes = {};
      const counts = {};
      Object.keys(byDate).forEach((d) => {
        totals[d] = computeTotals(byDate[d], d);
        counts[d] = byDate[d].reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] || 0) + 1 }), {});
        notes[d] = byDate[d].flatMap((e) =>
          entryNotes(e).map((n, i) => ({ id: `${e.id}-${i}`, time: e.entry_time, label: n.label, note: n.text }))
        );
      });
      setSurgeryDate(activeSurgery?.surgery_date || null);
      setDays(ds);
      setNotesByDay(notes);
      setCountsByDay(counts);
      setTotalsByDay(totals);
    };
    run();
  }, [activeSurgery, activeSurgeryId]);

  // The trackers this surgery asked to see summarised here, in settings order.
  const onCard = activeSurgery?.history_types || [];

  if (!days || !totalsByDay) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl uppercase">Day by day</h1>
      {days.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          No days yet — your history builds as you log.
        </p>
      )}
      {days.map((d) => {
        const t = totalsByDay[d.date] || computeTotals([], d.date);
        const flags = redFlagYesCount(d);
        const label = postOpLabel(surgeryDate, d.date);
        const notes = notesByDay[d.date] || [];
        const counts = countsByDay[d.date] || {};
        return (
          <Link key={d.id} to={`/day/${d.date}`} className="nb-card block p-3">
            <div className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="font-display text-xl uppercase truncate">{label || niceDate(d.date)}</span>
              {label && <span className="text-sm font-semibold text-muted-foreground shrink-0">{niceDate(d.date)}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {/* Only what this surgery asked for. A card that shows every
                  tracker shows nothing, because none of it stands out. */}
              {onCard.map((type) => {
                const cfg = TYPES[type];
                if (!cfg) return null;
                return (
                  <span
                    key={type}
                    className="nb-chip px-2.5 py-1 text-xs"
                    style={{ backgroundColor: cfg.color, color: cfg.darkText ? "#1A1024" : "#fff" }}
                  >
                    {cfg.label} {summaryFor(type, t, counts[type] || 0)}
                  </span>
                );
              })}
              <span
                className="nb-chip px-2.5 py-1 text-xs"
                style={flags > 0 ? { backgroundColor: "hsl(var(--destructive))", color: "#fff" } : { backgroundColor: "#06D6A0" }}
              >
                ⚑ {flags} red flag{flags === 1 ? "" : "s"}
              </span>
              {notes.length > 0 && (
                <span className="nb-chip px-2.5 py-1 text-xs bg-card">📝 {notes.length} note{notes.length === 1 ? "" : "s"}</span>
              )}
            </div>
            {/* The notes are the part of a day you cannot reconstruct from totals,
                so History shows them in full rather than making you open the day. */}
            {notes.length > 0 && (
              <div className="mt-2 pt-2 border-t-2 space-y-1">
                {notes.map((n) => (
                  <p key={n.id} className="text-xs break-words">
                    <span className="font-heading uppercase tracking-wide text-muted-foreground">
                      {n.time} {n.label}
                    </span>{" "}
                    <span className="italic">{n.note}</span>
                  </p>
                ))}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}