import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";
import { todayStr, dateRange, fullDate } from "@/lib/dates";
import { TYPES, RED_FLAG_ITEMS } from "@/lib/recovery";
import { computeTotals, sortEntries } from "@/lib/daySummary";

export default function Export() {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const generate = async () => {
    setBusy(true);
    setDone(false);
    const days = await base44.entities.RecoveryDay.list("date", 500);
    const dayMap = {};
    days.forEach((d) => {
      dayMap[d.date] = d;
    });
    const entries = await base44.entities.RecoveryEntry.list("created_date", 3000);
    const byDate = {};
    entries.forEach((e) => {
      (byDate[e.date] = byDate[e.date] || []).push(e);
    });

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const M = 42;
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = M;

    const line = (text, opts = {}) => {
      const size = opts.size || 10;
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.splitTextToSize(text, W - 2 * M).forEach((w) => {
        if (y > H - M) {
          doc.addPage();
          y = M;
        }
        doc.text(w, M, y);
        y += size + 4;
      });
      y += opts.gap || 0;
    };

    line("RECOVERY LOG", { bold: true, size: 18, gap: 2 });
    line(`${from} to ${to}`, { size: 10, gap: 10 });

    dateRange(from, to).forEach((date) => {
      const day = dayMap[date];
      const dayEntries = sortEntries(byDate[date] || []);
      if (!day && dayEntries.length === 0) return;
      const totals = computeTotals(dayEntries, date);

      line(`DAY ${day?.day_number ?? "?"} — ${fullDate(date)}`, { bold: true, size: 13, gap: 2 });
      line(
        `Woke ${day?.woke_at || "—"} · Temp AM ${totals.tempAm ?? "—"} / PM ${totals.tempPm ?? "—"} · Weight ${totals.weight ?? "—"} · Slept ${day?.slept_hours ?? "—"}h ${day?.slept_position || ""} · Photos ${totals.photoTaken ? "yes" : "no"}`,
        { size: 9 }
      );
      if (totals.nextMed) line(`Next med due: ${totals.nextMed.time}${totals.nextMed.drug ? ` (${totals.nextMed.drug})` : ""}`, { size: 9 });

      if (dayEntries.length === 0) line("(no entries)", { size: 9 });
      dayEntries.forEach((e) => {
        const cfg = TYPES[e.type];
        const d = e.data || {};
        line(`${e.entry_time}  [${cfg.marker(d, e, null)}]  ${cfg.label}: ${cfg.summary(d, e, null)}${e.note ? ` — ${e.note}` : ""}`, { size: 9 });
      });

      line(
        `TOTALS — Water ${totals.water}/100 oz · Protein ${totals.protein}/100 g · Garment ${(totals.garmentMin / 60).toFixed(1)}h · Movement ${totals.walks} · Sleep+naps ${(totals.sleepH + totals.napH).toFixed(1)}h · Temp PM ${totals.tempPm ?? "—"}`,
        { size: 9, bold: true }
      );
      if (totals.best)
        line(`Best check-in: ${totals.best.slot} (${totals.best.time}) · Worst: ${totals.worst.slot} (${totals.worst.time})`, { size: 9 });

      const answers = day?.red_flag_answers || {};
      const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");
      if (Object.keys(answers).length > 0) {
        if (yesKeys.length === 0) line("RED FLAGS — none", { size: 9, bold: true });
        yesKeys.forEach((k) => {
          const det = (day.red_flag_details || {})[k] || {};
          line(`RED FLAG — ${RED_FLAG_ITEMS.find((i) => i.key === k)?.label || k} at ${det.time || "—"}${det.office_called ? " · office called" : ""}`, { size: 9, bold: true });
        });
      }
      (day?.questions || []).forEach((q) => line(`Q for surgeon: ${q}`, { size: 9 }));
      y += 14;
    });

    doc.save(`recovery-log-${from}_to_${to}.pdf`);
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Export</h1>
      <div className="nb-card p-4 space-y-4">
        <p className="text-sm font-semibold">Save a day or a range as a PDF, paper-diary style.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-heading text-xs uppercase">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full min-w-0 h-12 border-2 rounded-xl bg-card px-3 font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="font-heading text-xs uppercase">To</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="w-full min-w-0 h-12 border-2 rounded-xl bg-card px-3 font-semibold"
            />
          </div>
        </div>
        <button
          className="nb-btn w-full h-14 bg-primary text-primary-foreground"
          onClick={generate}
          disabled={busy || !from || !to}
        >
          {busy ? "Building PDF…" : "Download PDF"}
        </button>
        {done && !busy && <p className="text-sm font-bold text-center">PDF downloaded ✔</p>}
      </div>
    </div>
  );
}