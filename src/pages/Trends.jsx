import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/recovery/AppLayout';
import { fmtDate, scoreCheckin } from '@/lib/recoveryUtils';
import { Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const METRICS = [
  { key: 'pain', label: 'Pain', worst: true, color: '#ef4444' },
  { key: 'energy', label: 'Energy', worst: false, color: '#10b981' },
  { key: 'mood', label: 'Mood', worst: false, color: '#3b82f6' },
  { key: 'mobility', label: 'Mobility', worst: false, color: '#8b5cf6' },
];

export default function Trends() {
  const [days, setDays] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ds = await base44.entities.RecoveryDay.list('date', 200);
        setDays(ds);
        const ents = await Promise.all(ds.map((d) => base44.entities.RecoveryEntry.filter({ day_id: d.id })));
        setAllEntries(ents.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = useMemo(() => {
    // For each day, average each check-in metric across that day's check-in entries.
    return days.map((d) => {
      const dayEntries = allEntries.filter((e) => e.day_id === d.id && e.type === 'checkin');
      const avg = (key) => {
        if (!dayEntries.length) return null;
        const sum = dayEntries.reduce((s, e) => s + (Number(e.data?.[key]) || 0), 0);
        return Math.round((sum / dayEntries.length) * 10) / 10;
      };
      return {
        label: `D${d.day_number}`,
        date: fmtDate(d.date),
        pain: avg('pain'),
        energy: avg('energy'),
        mood: avg('mood'),
        mobility: avg('mobility'),
        water: d.water_total ?? 0,
        protein: d.protein_total ?? 0,
        sleep: d.sleep_total ?? 0,
      };
    });
  }, [days, allEntries]);

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  if (days.length === 0) {
    return <AppLayout><p className="text-sm text-muted-foreground py-16 text-center">No data yet. Log a few days to see trends.</p></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">Trends</h1>

        <ChartCard title="Check-in scores (daily average)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {METRICS.map((m) => (
                <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} dot={{ r: 2 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily totals vs targets">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="water" name="Water (oz)" stroke="#0ea5e9" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#10b981" dot={{ r: 2 }} />
              <Line type="monotone" dataKey="sleep" name="Sleep (h)" stroke="#6366f1" dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </AppLayout>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}