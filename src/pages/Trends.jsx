import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { computeTotals } from "@/lib/daySummary";
import { fetchAllRows } from "@/lib/paging";
import { goalFor, nutrientGoals } from "@/lib/recovery";
import { daysBetween, shortDate, todayStr, addDays } from "@/lib/dates";
import { usePatient } from "@/lib/PatientContext";
import ScopeSwitch from "@/components/recovery/ScopeSwitch";
import PullToRefresh from "@/components/PullToRefresh";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ReferenceLine
} from "recharts";

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

const avg = (list) => {
  const nums = list.filter((n) => n != null);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
};
const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

// A recovery gets longer, and a chart that fits every day into one screen gets
// less readable the longer it runs. The default is the last month, which is
// what a follow-up visit asks about.
const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "all", label: "All", days: null }
];

export default function Trends() {
  const { surgeries, scope, setScope, scopeRecords, patientId } = usePatient();
  const [rows, setRows] = useState(null);
  const [range, setRange] = useState("30");

  const single = scopeRecords.length === 1 ? scopeRecords[0] : null;
  const all = !single;
  const surgeryDate = single?.surgery_date || null;

  // A target belongs to one record. Across several there is no single answer,
  // and drawing one record's line through another record's days would be
  // inventing a goal she never set for those days.
  const waterGoal = single ? goalFor(single, "water") : null;
  const proteinGoal = single ? nutrientGoals(single).Protein || null : null;

  const load = useCallback(async () => {
    if (!scopeRecords.length || !patientId) {
      setRows([]);
      return;
    }
    const q = all ? { patient_id: patientId } : { surgery_id: single.id };
    // Paged rather than capped. The old 500/5,000 stopped dead partway through
    // a long recovery and the chart simply had no older points on it.
    const entries = await fetchAllRows(base44.entities.RecoveryEntry, q, "created_date", 2000);
    const byDate = {};
    entries.forEach((e) => {
      (byDate[e.date] = byDate[e.date] || []).push(e);
    });
    // One row per calendar date. In "all" scope a date with entries on two
    // records is one point, averaged and totalled across both.
    const data = Object.keys(byDate).sort().map((date) => {
      const es = byDate[date];
      const checkins = es.filter((e) => e.type === "checkin");
      const t = computeTotals(es, date);
      return {
        date,
        label: surgeryDate ? `D${daysBetween(surgeryDate, date)}` : shortDate(date),
        pain: round1(avg(checkins.map((e) => e.data?.pain))),
        energy: round1(avg(checkins.map((e) => e.data?.energy))),
        mood: round1(avg(checkins.map((e) => e.data?.mood))),
        water: t.water,
        protein: t.protein,
        sleep: round1(t.sleepH + t.napH)
      };
    });
    setRows(data);
  }, [all, single, patientId, surgeryDate, scopeRecords.length]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    if (!rows) return null;
    const days = RANGES.find((r) => r.key === range)?.days;
    if (!days) return rows;
    // From today rather than from the last logged day, so "7 days" means the
    // last seven days and a gap in the middle of them reads as a gap.
    const from = addDays(todayStr(), -(days - 1));
    return rows.filter((r) => r.date >= from);
  }, [rows, range]);

  if (!rows) return <Spinner />;

  // Named in the heading rather than left as a bare dashed line, because a line
  // at 100 that means two different things for two series says nothing.
  const totalsHeading = [
    waterGoal ? `water ${waterGoal} oz` : null,
    proteinGoal ? `protein ${proteinGoal} g` : null
  ].filter(Boolean);

  return (
    <PullToRefresh onRefresh={load}>
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Trends</h1>
      <ScopeSwitch surgeries={surgeries} scope={scope} onScope={setScope} />

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className="nb-chip px-3 py-1.5 text-xs whitespace-nowrap"
            style={range === r.key ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
          >
            {r.label}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          Trends need a few days of check-ins. Keep logging and the lines appear here.
        </p>
      )}

      {rows.length > 0 && shown.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card break-words">
          Nothing logged in the last {RANGES.find((r) => r.key === range)?.label.toLowerCase()}. Tap All to see
          the whole record.
        </p>
      )}

      {shown.length > 0 && (
        <>
          <div className="nb-card p-3">
            <h2 className="font-heading text-xs uppercase tracking-wider mb-2">Check-in scores (daily average)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={shown} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="pain" name="Pain" stroke="#FF2E88" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="energy" name="Energy" stroke="#06D6A0" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="mood" name="Mood" stroke="#9B5DE5" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="nb-card p-3">
            <h2 className="font-heading text-xs uppercase tracking-wider mb-2">
              Daily totals{totalsHeading.length ? ` vs your goals (${totalsHeading.join(", ")})` : ""}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shown} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {/* One line per series, from the goal she actually set. No goal,
                    no line: a dashed rule at a number nobody chose is worse
                    than no rule at all. */}
                {waterGoal && <ReferenceLine y={waterGoal} strokeDasharray="4 4" stroke="#00B4D8" strokeWidth={2} />}
                {proteinGoal && <ReferenceLine y={proteinGoal} strokeDasharray="4 4" stroke="#FF9E00" strokeWidth={2} />}
                <Bar dataKey="water" name="Water (oz)" fill="#00B4D8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" name="Protein (g)" fill="#FF9E00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {!totalsHeading.length && (
              <p className="text-2xs font-semibold text-muted-foreground break-words">
                {all
                  ? "Goals belong to one record. Pick a single record above to see them here."
                  : "Set a water or protein goal in Setup and it draws as a line here."}
              </p>
            )}
          </div>

          {/* Sleep was totalled on every row and never drawn. */}
          <div className="nb-card p-3">
            <h2 className="font-heading text-xs uppercase tracking-wider mb-2">Rest (hours a day)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={shown} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sleep" name="Rest" stroke="#5A189A" strokeWidth={3} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
    </PullToRefresh>
  );
}
