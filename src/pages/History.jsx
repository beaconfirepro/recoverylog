import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { niceDate } from "@/lib/dates";
import { computeTotals, redFlagYesCount } from "@/lib/daySummary";

export default function History() {
  const [days, setDays] = useState(null);
  const [totalsByDay, setTotalsByDay] = useState(null);

  useEffect(() => {
    const run = async () => {
      const [ds, entries] = await Promise.all([
        base44.entities.RecoveryDay.list("-date", 200),
        base44.entities.RecoveryEntry.list("created_date", 3000)
      ]);
      const byDate = {};
      entries.forEach((e) => {
        (byDate[e.date] = byDate[e.date] || []).push(e);
      });
      const totals = {};
      Object.keys(byDate).forEach((d) => {
        totals[d] = computeTotals(byDate[d], d);
      });
      setDays(ds);
      setTotalsByDay(totals);
    };
    run();
  }, []);

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
        return (
          <Link key={d.id} to={`/day/${d.date}`} className="nb-card block p-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl uppercase">Day {d.day_number}</span>
              <span className="text-sm font-semibold text-muted-foreground">{niceDate(d.date)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="nb-chip h-7 px-2.5 text-xs bg-[#00B4D8] text-white">💧 {t.water} oz</span>
              <span className="nb-chip h-7 px-2.5 text-xs bg-[#FF9E00] text-[#1A1024]">🍗 {t.protein} g</span>
              <span className="nb-chip h-7 px-2.5 text-xs bg-[#4361EE] text-white">🏃 {t.walks} movement</span>
              <span className="nb-chip h-7 px-2.5 text-xs bg-[#5A189A] text-white">😴 {(t.sleepH + t.napH).toFixed(1)} h</span>
              <span
                className="nb-chip h-7 px-2.5 text-xs"
                style={flags > 0 ? { backgroundColor: "hsl(var(--destructive))", color: "#fff" } : { backgroundColor: "#06D6A0" }}
              >
                ⚑ {flags} red flag{flags === 1 ? "" : "s"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}