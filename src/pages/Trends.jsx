import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { asRows } from "@/lib/recoveryUtils";
import { computeTotals } from "@/lib/daySummary";
import { daysBetween, shortDate } from "@/lib/dates";
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

export default function Trends() {
  const { surgeries, scope, setScope, scopeRecords, patientId } = usePatient();
  const [rows, setRows] = useState(null);

  const single = scopeRecords.length === 1 ? scopeRecords[0] : null;
  const all = !single;
  const surgeryDate = single?.surgery_date || null;

  const load = useCallback(async () => {
    if (!scopeRecords.length || !patientId) {
      setRows([]);
      return;
    }
    const q = all ? { patient_id: patientId } : { surgery_id: single.id };
    const [daysRaw, entriesRaw] = await Promise.all([
      base44.entities.RecoveryDay.filter(q, "date", 500),
      base44.entities.RecoveryEntry.filter(q, "created_date", 5000)
    ]);
    const days = asRows(daysRaw);
    const entries = asRows(entriesRaw);
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

  if (!rows) return <Spinner />;

  return (
    <PullToRefresh onRefresh={load}>
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Trends</h1>
      <ScopeSwitch surgeries={surgeries} scope={scope} onScope={setScope} />
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          Trends need a few days of check-ins. Keep logging and the lines appear here.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="nb-card p-3">
            <h2 className="font-heading text-xs uppercase tracking-wider mb-2">Check-in scores (daily average)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
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
            <h2 className="font-heading text-xs uppercase tracking-wider mb-2">Daily totals vs 100 target</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={rows} margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={100} strokeDasharray="4 4" stroke="hsl(var(--foreground))" />
                <Bar dataKey="water" name="Water (oz)" fill="#00B4D8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="protein" name="Protein (g)" fill="#FF9E00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
    </PullToRefresh>
  );
}