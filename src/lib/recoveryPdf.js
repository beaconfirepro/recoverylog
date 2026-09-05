import { jsPDF } from "jspdf";
import { dateRange, fullDate, postOpLabel } from "@/lib/dates";
import { TYPES, RED_FLAG_ITEMS } from "@/lib/recovery";
import { computeTotals, sortEntries } from "@/lib/daySummary";

// The app's palette, so the printout looks like the thing it came from.
const INK = [25, 19, 37];
const CREAM = [253, 241, 236];
const PINK = [255, 26, 140];
const LIME = [175, 239, 47];
const RED = [237, 29, 29];
const MUTED = [246, 234, 228];
const GREY = [116, 108, 128];

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16)
];

const PAGE = { m: 40, radius: 6 };

export function buildRecoveryPdf({ from, to, surgeryDate, days, entries, patientName }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = PAGE.m;
  const R = W - PAGE.m;
  const BOTTOM = H - PAGE.m - 18;
  let y = 0;
  let page = 0;

  const paintPage = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, W, H, "F");
    page += 1;
    // Footer rule and page number.
    doc.setDrawColor(...INK);
    doc.setLineWidth(1);
    doc.line(L, H - PAGE.m - 6, R, H - PAGE.m - 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text("RECOVERY LOG", L, H - PAGE.m + 6);
    doc.text(String(page), R, H - PAGE.m + 6, { align: "right" });
    y = PAGE.m;
  };

  const ensure = (h) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      paintPage();
    }
  };

  const text = (s, x, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(...(opts.color || INK));
    doc.text(String(s), x, y, opts.align ? { align: opts.align } : undefined);
  };

  // A rounded, hard-bordered block in the app's card style.
  const card = (h, fill) => {
    ensure(h);
    doc.setFillColor(...(fill || [255, 255, 255]));
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.6);
    doc.roundedRect(L, y, R - L, h, PAGE.radius, PAGE.radius, "FD");
  };

  const chip = (x, cy, label, fillRgb, dark) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const w = doc.getTextWidth(label) + 12;
    doc.setFillColor(...fillRgb);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, cy - 8, w, 12, 3, 3, "FD");
    doc.setTextColor(...(dark ? INK : [255, 255, 255]));
    doc.text(label, x + 6, cy);
    return w + 5;
  };

  // ---- cover ------------------------------------------------------------
  paintPage();

  doc.setFillColor(...INK);
  doc.roundedRect(L, y, R - L, 74, PAGE.radius, PAGE.radius, "F");
  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...CREAM);
  doc.text("RECOVERY LOG", L + 16, y);
  doc.setFillColor(...PINK);
  doc.rect(L + 16, y + 6, 92, 5, "F");
  y += 26;
  doc.setFontSize(10);
  doc.setTextColor(...CREAM);
  doc.text(patientName ? patientName.toUpperCase() : "PATIENT NOT NAMED", L + 16, y);
  doc.text(`${fullDate(from)}  —  ${fullDate(to)}`, R - 16, y, { align: "right" });
  y += 34;

  // ---- days -------------------------------------------------------------
  const dayMap = {};
  days.forEach((d) => {
    dayMap[d.date] = d;
  });
  const byDate = {};
  entries.forEach((e) => {
    (byDate[e.date] = byDate[e.date] || []).push(e);
  });

  let printed = 0;

  dateRange(from, to).forEach((date) => {
    const day = dayMap[date];
    const dayEntries = sortEntries(byDate[date] || []);
    if (!day && dayEntries.length === 0) return;
    printed += 1;
    const totals = computeTotals(dayEntries, date);

    // Day heading on a pink bar.
    ensure(46);
    doc.setFillColor(...PINK);
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.6);
    doc.roundedRect(L, y, R - L, 26, PAGE.radius, PAGE.radius, "FD");
    y += 17;
    text((postOpLabel(surgeryDate, date) || "Surgery date not set").toUpperCase(), L + 12, {
      bold: true,
      size: 12,
      color: [255, 255, 255]
    });
    text(fullDate(date), R - 12, { bold: true, size: 9, color: [255, 255, 255], align: "right" });
    y += 20;

    // Vitals as chips, only the ones that exist.
    const vitals = [
      totals.tempAm != null && `AM ${totals.tempAm}`,
      totals.tempPm != null && `PM ${totals.tempPm}`,
      totals.weight != null && `WEIGHT ${totals.weight}`,
      day?.woke_at && `WOKE ${day.woke_at}`,
      totals.photoTaken && "PHOTO",
      totals.nextMed && `NEXT MED ${totals.nextMed.time}`
    ].filter(Boolean);
    if (vitals.length) {
      ensure(18);
      let x = L + 2;
      vitals.forEach((v) => {
        x += chip(x, y, v, MUTED, true);
      });
      y += 16;
    }

    // Entries, each led by its own colour.
    if (dayEntries.length === 0) {
      ensure(16);
      text("Nothing logged this day.", L + 4, { size: 9, color: GREY });
      y += 14;
    }
    dayEntries.forEach((e) => {
      const cfg = TYPES[e.type];
      if (!cfg) return;
      const d = e.data || {};
      const body = `${cfg.label}: ${cfg.summary(d, e, null)}${e.note ? ` — ${e.note}` : ""}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(body, R - L - 78);
      ensure(lines.length * 12 + 6);

      doc.setFillColor(...hex(cfg.color));
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.8);
      doc.circle(L + 8, y - 3, 3.4, "FD");

      text(e.entry_time, L + 18, { bold: true, size: 9 });
      lines.forEach((ln, i) => {
        text(ln, L + 62, { size: 9 });
        if (i < lines.length - 1) y += 11;
      });
      y += 14;
    });

    // Totals strip.
    ensure(30);
    doc.setFillColor(...LIME);
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.2);
    doc.roundedRect(L, y - 2, R - L, 20, 4, 4, "FD");
    y += 11;
    text(
      `WATER ${totals.water}/100oz   ·   PROTEIN ${totals.protein}/100g   ·   GARMENT ${(totals.garmentMin / 60).toFixed(1)}h   ·   MOVEMENT ${totals.walks}   ·   SLEEP ${(totals.sleepH + totals.napH).toFixed(1)}h`,
      L + 10,
      { bold: true, size: 8 }
    );
    y += 16;

    // Red flags get their own loud block.
    const answers = day?.red_flag_answers || {};
    const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");
    if (Object.keys(answers).length > 0) {
      if (yesKeys.length === 0) {
        ensure(14);
        text("Red flags checked — none.", L + 4, { size: 8.5, color: GREY });
        y += 14;
      } else {
        yesKeys.forEach((k) => {
          const det = (day.red_flag_details || {})[k] || {};
          const label = RED_FLAG_ITEMS.find((i) => i.key === k)?.label || k;
          const line = `${label}${det.time ? ` at ${det.time}` : ""}${det.office_called ? " · office called" : ""}`;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(line, R - L - 70);
          ensure(lines.length * 12 + 10);
          doc.setFillColor(...RED);
          doc.setDrawColor(...INK);
          doc.setLineWidth(1.2);
          doc.roundedRect(L, y - 10, R - L, lines.length * 12 + 8, 4, 4, "FD");
          y += 3;
          text("RED FLAG", L + 10, { bold: true, size: 8, color: [255, 255, 255] });
          lines.forEach((ln, i) => {
            text(ln, L + 68, { bold: true, size: 9, color: [255, 255, 255] });
            if (i < lines.length - 1) y += 11;
          });
          y += 18;
        });
      }
    }

    (day?.questions || []).forEach((q) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(`Q for surgeon: ${q}`, R - L - 20);
      ensure(lines.length * 12);
      lines.forEach((ln, i) => {
        text(ln, L + 6, { size: 9, color: [90, 24, 154] });
        if (i < lines.length - 1) y += 11;
      });
      y += 14;
    });

    y += 10;
  });

  if (printed === 0) {
    card(50, MUTED);
    y += 22;
    text("Nothing logged in this range.", L + 14, { bold: true, size: 11 });
    y += 16;
    text("Pick a wider range on the Profile page.", L + 14, { size: 9, color: GREY });
    y += 20;
  }

  return doc;
}
