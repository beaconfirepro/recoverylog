import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/recovery/AppLayout';
import { fmtDate, todayStr } from '@/lib/recoveryUtils';
import { exportRangeToPdf } from '@/lib/pdfExport';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Plus } from 'lucide-react';

export default function History() {
  const [days, setDays] = useState([]);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const ds = await base44.entities.RecoveryDay.list('-date', 200);
      setDays(ds);
      const map = {};
      await Promise.all(ds.map(async (d) => {
        const ents = await base44.entities.RecoveryEntry.filter({ day_id: d.id });
        map[d.date] = ents;
      }));
      setEntriesByDate(map);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          {days.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportRangeToPdf(days, entriesByDate)}>
              <Download className="w-4 h-4 mr-1.5" /> Export all
            </Button>
          )}
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:bg-accent">
          <Plus className="w-4 h-4" /> Today's log
        </Link>

        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No days logged yet.</p>
        ) : (
          <div className="space-y-2">
            {days.map((d) => {
              const ents = entriesByDate[d.date] || [];
              return (
                <Link
                  key={d.id}
                  to={d.date === todayStr() ? '/' : `/day/${d.date}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:bg-accent transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Day {d.day_number}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(d.date)}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground space-y-0.5">
                      <div>{ents.length} entries</div>
                      <div>Water {d.water_total ?? 0}oz · Protein {d.protein_total ?? 0}g</div>
                      <div>Sleep {d.sleep_total ?? 0}h · Walks {d.walk_count ?? 0}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}