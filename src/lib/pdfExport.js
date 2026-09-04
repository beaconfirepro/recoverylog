import { jsPDF } from 'jspdf';
import { ENTRY_TYPE_MAP, RED_FLAG_ITEMS } from './recoveryConfig';
import { fmtTime, fmtDateLong, entrySummary, computeTotals } from './recoveryUtils';

const left = 40;
const right = 555;
let y = 0;

function line(doc, text, size = 10, bold = false) {
  doc.setFontSize(size);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const wrapped = doc.splitTextToSize(text, right - left);
  wrapped.forEach((w) => {
    if (y > 780) { doc.addPage(); y = 40; }
    doc.text(w, left, y);
    y += size * 1.35 + 2;
  });
}

function hr(doc) {
  if (y > 780) { doc.addPage(); y = 40; }
  doc.setDrawColor(210);
  doc.line(left, y, right, y);
  y += 8;
}

function header(doc, text) {
  y += 4;
  line(doc, text, 13, true);
  y += 2;
}

export function exportDayToPdf(day, entries) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  y = 50;
  line(doc, `Post-Op Recovery — Day ${day.day_number}`, 18, true);
  line(doc, fmtDateLong(day.date), 11);
  y += 6;

  header(doc, 'Day Header');
  const h = day;
  line(doc, `Last BM: ${h.last_bm_date || '—'}   Next med due: ${h.next_med_due ? fmtTime(h.next_med_due) : '—'}`);
  line(doc, `Woke at: ${h.woke_at || '—'}   Temp AM: ${h.temp_am ?? '—'}   Temp PM: ${h.temp_pm ?? '—'}   Weight: ${h.weight ?? '—'}`);
  line(doc, `Slept: ${h.slept_hours ?? '—'}h (${h.slept_position || '—'})   Photos taken: ${h.photos_taken ? 'Yes' : 'No'}`);
  if (h.measurement_spots?.length) {
    line(doc, `Measurements: ${h.measurement_spots.map((s) => `${s}: ${h.measurements?.[s] ?? '—'}`).join('   ')}`);
  }
  hr(doc);

  header(doc, 'Entries (time · entry · marker)');
  const sorted = [...entries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  if (!sorted.length) line(doc, 'No entries yet.');
  sorted.forEach((e, idx) => {
    const type = ENTRY_TYPE_MAP[e.type];
    const marker = type ? type.abbr : e.type;
    line(doc, `${fmtTime(e.timestamp)}   ${entrySummary(e)}   [${marker}]`, 10);
  });
  hr(doc);

  const totals = computeTotals(entries, day);
  header(doc, 'Day Totals');
  line(doc, `Water: ${totals.water_total} / 100 oz   Protein: ${totals.protein_total} / 100 g`);
  line(doc, `Hours in garment: ${totals.garment_hours ?? 0}   Walks: ${totals.walk_count}   Sleep + naps: ${totals.sleep_total}h   Temp PM: ${totals.temp_pm ?? '—'}`);
  if (totals.best_checkin) line(doc, `Best check-in: ${totals.best_checkin.time}`);
  if (totals.worst_checkin) line(doc, `Worst check-in: ${totals.worst_checkin.time}`);
  hr(doc);

  header(doc, 'Red Flag Check');
  const rf = day.red_flags || {};
  const anyYes = Object.keys(rf).some((k) => rf[k]);
  if (!anyYes) {
    line(doc, 'All clear — no red flags.');
  } else {
    RED_FLAG_ITEMS.forEach((item) => {
      if (rf[item.key]) line(doc, `YES — ${item.label}`);
    });
    line(doc, `Office called: ${day.red_flag_office_called ? 'Yes' : 'No'}${day.red_flag_time ? ` at ${day.red_flag_time}` : ''}`);
  }
  hr(doc);

  header(doc, 'Questions for the Surgeon');
  const qs = day.questions || [];
  if (!qs.length) line(doc, 'None.');
  qs.forEach((q, i) => line(doc, `${i + 1}. ${q.text}${q.answered ? '  ✓' : ''}`));

  doc.save(`recovery-day-${day.date}.pdf`);
}

export function exportRangeToPdf(days, entriesByDate) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  y = 50;
  line(doc, 'Post-Op Recovery — Range Export', 18, true);
  if (days.length) {
    line(doc, `${fmtDateLong(days[days.length - 1].date)}  →  ${fmtDateLong(days[0].date)}`, 11);
  }
  y += 8;

  // Most recent last in the doc for readability.
  const ordered = [...days].reverse();
  ordered.forEach((day) => {
    doc.addPage();
    y = 50;
    const entries = entriesByDate[day.date] || [];
    line(doc, `Day ${day.day_number} — ${fmtDateLong(day.date)}`, 14, true);
    y += 4;
    const totals = computeTotals(entries, day);
    line(doc, `Water ${totals.water_total}/100oz  Protein ${totals.protein_total}/100g  Garment ${totals.garment_hours ?? 0}h  Walks ${totals.walk_count}  Sleep ${totals.sleep_total}h  Temp PM ${totals.temp_pm ?? '—'}`, 9);
    y += 4;
    const sorted = [...entries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
    sorted.forEach((e) => {
      const type = ENTRY_TYPE_MAP[e.type];
      line(doc, `${fmtTime(e.timestamp)}  ${entrySummary(e)}  [${type ? type.abbr : e.type}]`, 9);
    });
    const qs = day.questions || [];
    if (qs.length) {
      y += 4;
      line(doc, 'Questions:', 10, true);
      qs.forEach((q, i) => line(doc, `${i + 1}. ${q.text}${q.answered ? ' ✓' : ''}`, 9));
    }
  });

  doc.save('recovery-range.pdf');
}