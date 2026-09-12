import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { monthKey, monthLabel, niceDate, postOpLabel } from "@/lib/dates";
import { computeTotals, redFlagYesCount } from "@/lib/daySummary";
import { fetchAllRows } from "@/lib/paging";
import { TYPES, entryNotes } from "@/lib/recovery";
import { usePatient } from "@/lib/PatientContext";
import { recordLabel } from "@/lib/scope";
import ScopeSwitch from "@/components/recovery/ScopeSwitch";
import JumpToDate from "@/components/recovery/JumpToDate";
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

// Opening a day creates its day row, so a row on its own no longer means the
// day was logged — walking back through a fortnight with the arrows leaves a
// fortnight of empty rows behind. A row earns a card by carrying something she
// put there: the red flag check, or a question for the surgeon.
const dayHasOwnContent = (day) =>
  !!day?.red_flag_completed ||
  redFlagYesCount(day) > 0 ||
  (day?.questions || []).some((q) => (q || "").trim());

// The month headers stick under the app bar, which is 2rem of content plus its
// padding and border. Getting this a little wrong shows as a gap rather than a
// covered heading: `main` isolates its stacking context, so nothing in the page
// can paint over the bar.
const STICKY_TOP = "calc(var(--safe-t) + 3.375rem)";

export default function History() {
  const { surgeries, scope, setScope, scopeRecords, patientId } = usePatient();
  const [days, setDays] = useState(null);
  const [byDate, setByDate] = useState({});
  const [flagsOnly, setFlagsOnly] = useState(false);

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
    // Paged rather than a single capped read. A year and a half of daily
    // logging is more than one page of either table, and the page used to stop
    // at the cap and show nothing older, which is indistinguishable from the
    // record not going back that far.
    const [ds, entries] = await Promise.all([
      fetchAllRows(base44.entities.RecoveryDay, q, "-date", 500),
      fetchAllRows(base44.entities.RecoveryEntry, q, "created_date", 2000)
    ]);
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
  const dayRowsByDate = useMemo(() => {
    const m = {};
    (days || []).forEach((d) => (m[d.date] = m[d.date] || []).push(d));
    return m;
  }, [days]);

  // The dates with entries, plus any date whose day row carries something of
  // its own. Entries alone hid a day she had answered the red flag check on
  // and logged nothing else — the one day she would most want to find again.
  const dates = useMemo(() => {
    const set = new Set(Object.keys(byDate));
    (days || []).forEach((d) => {
      if (dayHasOwnContent(d)) set.add(d.date);
    });
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [byDate, days]);

  const flagsFor = useCallback(
    (date) => (dayRowsByDate[date] || []).reduce((s, d) => s + redFlagYesCount(d), 0),
    [dayRowsByDate]
  );

  // "Which days did something go wrong?" is the question she has in front of an
  // appointment, and scrolling three months of cards is not an answer.
  const shown = useMemo(
    () => (flagsOnly ? dates.filter((date) => flagsFor(date) > 0) : dates),
    [dates, flagsOnly, flagsFor]
  );

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
      <h1 className="font-display text-2xl uppercase">Day by Day</h1>
      <ScopeSwitch surgeries={surgeries} scope={scope} onScope={setScope} />

      <div className="flex flex-wrap items-center gap-2">
        <JumpToDate />
        <button
          type="button"
          onClick={() => setFlagsOnly((v) => !v)}
          aria-pressed={flagsOnly}
          className="nb-chip px-3 py-1.5 text-xs bg-card"
          style={flagsOnly ? { backgroundColor: "hsl(var(--destructive))", color: "#fff" } : {}}
        >
          ⚑ Red flags only
        </button>
      </div>

      {dates.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          No days logged yet. Your first entry on Today starts the record, and you can jump back to
          a day you missed.
        </p>
      )}
      {dates.length > 0 && shown.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          No red flags on any day here. Tap Red flags only again to see every day.
        </p>
      )}
      {shown.map((date, idx) => {
        const es = byDate[date] || [];
        const t = computeTotals(es, date);
        const counts = es.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] || 0) + 1 }), {});
        const notes = es.flatMap((e) =>
          entryNotes(e).map((n, i) => ({ id: `${e.id}-${i}`, time: e.entry_time, label: n.label, note: n.text }))
        );
        const flags = flagsFor(date);
        const label = surgeryDate ? postOpLabel(surgeryDate, date) : null;
        // A hundred days of cards are all the same size and all the same shape.
        // The month is the only thing that tells you where you are in them, so
        // it stays on screen while its days scroll past.
        const startsMonth = idx === 0 || monthKey(shown[idx - 1]) !== monthKey(date);
        return (
          <React.Fragment key={date}>
            {startsMonth && (
              <h2
                className="sticky z-10 -mx-1 px-1 py-1.5 bg-background font-heading text-xs uppercase tracking-wider text-muted-foreground"
                style={{ top: STICKY_TOP }}
              >
                {monthLabel(date)}
              </h2>
            )}
            <Link to={`/day/${date}`} className="nb-card block p-3">
              <div className="flex items-baseline justify-between gap-2 min-w-0">
                <span className="font-display text-xl uppercase truncate">
                  {label || niceDate(date)}
                </span>
                {label && <span className="text-sm font-semibold text-muted-foreground shrink-0">{niceDate(date)}</span>}
                {all && (
                  <span className="text-xs font-semibold shrink-0">
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
                {es.length === 0 && (
                  // A day that only carries the red flag check or a question has
                  // no chips to speak of, and an empty card reads as a bug.
                  <span className="nb-chip px-2.5 py-1 text-xs bg-card">Nothing logged</span>
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
          </React.Fragment>
        );
      })}
    </div>
    </PullToRefresh>
  );
}
