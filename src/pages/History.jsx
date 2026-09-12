import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { niceDate, postOpLabel } from "@/lib/dates";
import { computeTotals, redFlagYesCount } from "@/lib/daySummary";
import { TYPES, entryNotes } from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
import { usePatient } from "@/lib/PatientContext";
import { recordLabel } from "@/lib/scope";
import ScopeSwitch from "@/components/recovery/ScopeSwitch";
import PullToRefresh from "@/components/PullToRefresh";

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
  const { surgeries, scope, setScope, scopeRecords, patientId } = usePatient();
  const [days, setDays] = useState(null);
  const [byDate, setByDate] = useState({});

  const single = scopeRecords.length === 1 ? scopeRecords[0] : null;
  const all = !single;

  // The trackers any record in scope asked to see summarised here. In "all"
  // scope that is the union, so a day card shows whatever any record singled out.
  const onCard = useMemo(() => {
    const set = new Set();
    scopeRecords.forEach((r) => (r.history_types || []).forEach((t) => set.add(t)));
    return [...set];
  }, [scopeRecords]);

  const load = useCallback(async () => {
    if (!scopeRecords.length || !patientId) {
      setDays([]);
      setByDate({});
      return;
    }
    const q = all ? { patient_id: patientId } : { surgery_id: single.id };
    const [dsRaw, entriesRaw] = await Promise.all([
      base44.entities.RecoveryDay.filter(q, "-date", 500),
      base44.entities.RecoveryEntry.filter(q, "created_date", 5000)
    ]);
    const ds = asRows(dsRaw);
    const entries = asRows(entriesRaw);
    const grouped = {};
    entries.forEach((e) => {
      (grouped[e.date] = grouped[e.date] || []).push(e);
    });
    setDays(ds);
    setByDate(grouped);
  }, [all, single, patientId, scopeRecords.length]);

  useEffect(() => {
    load();
  }, [load]);

  // One card per calendar date. A date with entries on two records still reads
  // as one day; its red flags are the sum across that date's day rows.
  const dates = useMemo(() => Object.keys(byDate).sort((a, b) => (a < b ? 1 : -1)), [byDate]);
  const dayRowsByDate = useMemo(() => {
    const m = {};
    days.forEach((d) => (m[d.date] = m[d.date] || []).push(d));
    return m;
  }, [days]);

  if (!days || byDate === null) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const surgeryDate = single?.surgery_date || null;

  return (
    <PullToRefresh onRefresh={load}>
    <div className="space-y-3">
      <h1 className="font-display text-2xl uppercase">Day by day</h1>
      <ScopeSwitch surgeries={surgeries} scope={scope} onScope={setScope} />

      {dates.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          No days logged yet. Your first entry on Today starts the record.
        </p>
      )}
      {dates.map((date) => {
        const es = byDate[date] || [];
        const t = computeTotals(es, date);
        const counts = es.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] || 0) + 1 }), {});
        const notes = es.flatMap((e) =>
          entryNotes(e).map((n, i) => ({ id: `${e.id}-${i}`, time: e.entry_time, label: n.label, note: n.text }))
        );
        const dayRows = dayRowsByDate[date] || [];
        const flags = dayRows.reduce((s, d) => s + redFlagYesCount(d), 0);
        const label = surgeryDate ? postOpLabel(surgeryDate, date) : null;
        return (
          <Link key={date} to={`/day/${date}`} className="nb-card block p-3">
            <div className="flex items-baseline justify-between gap-2 min-w-0">
              <span className="font-display text-xl uppercase truncate">
                {label || niceDate(date)}
              </span>
              {label && <span className="text-sm font-semibold text-muted-foreground shrink-0">{niceDate(date)}</span>}
              {all && (
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                  {Array.from(new Set(es.map((e) => e.surgery_id)))
                    .map((id) => recordLabel(scopeRecords.find((r) => r.id === id)))
                    .join(" · ")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {/* Only what a record in scope asked for. A card that shows every
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
    </PullToRefresh>
  );
}