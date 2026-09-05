import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { computeTotals } from "@/lib/daySummary";
import { daysBetween, shortDate } from "@/lib/dates";
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
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const run = async () => {
      const [info, days, entries] = await Promise.all([
        base44.entities.SurgeryInfo.list("created_date", 1),
        base44.entities.RecoveryDay.list("date", 200),
        base44.entities.RecoveryEntry.list("created_date", 3000)
      ]);
      const surgeryDate = info[0]?.surgery_date || null;
      const byDate = {};
      entries.forEach((e) => {
        (byDate[e.date] = byDate[e.date] || []).push(e);
      });
      const data = days.map((d) => {
        const es = byDate[d.date] || [];
        const checkins = es.filter((e) => e.type === "checkin");
        const t = computeTotals(es, d.date);
        return {
          label: surgeryDate ? `D${daysBetween(surgeryDate, d.date)}` : shortDate(d.date),
          pain: round1(avg(checkins.map((e) => e.data?.pain))),
          energy: round1(avg(checkins.map((e) => e.data?.energy))),
          mood: round1(avg(checkins.map((e) => e.data?.mood))),
          water: t.water,
          protein: t.protein,
          sleep: round1(t.sleepH + t.napH)
        };
      });
      setRows(data);
    };
    run();
  }, []);

  if (!rows) return <Spinner />;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Trends</h1>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground border-2 rounded-xl p-4 bg-card">
          Log a few check-ins and the charts will draw themselves.
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
  );
}