import { jsPDF } from "jspdf";
import { dateRange, fullDate, postOpLabel } from "@/lib/dates";
import { TYPES, RED_FLAG_ITEMS } from "@/lib/recovery";
import { computeTotals, sortEntries } from "@/lib/daySummary";

// The app's palette. The page itself stays white so this prints without
// flooding a cartridge; the colour lives in the headings and chips.
const INK = [25, 19, 37];
const PINK = [255, 26, 140];
const LIME = [175, 239, 47];
const RED = [237, 29, 29];
const PAPER = [246, 240, 236];
const GREY = [116, 108, 128];
const PURPLE = [90, 24, 154];

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16)
];

// A PDF standard font is WinAnsi-encoded, so anything outside Latin-1 has no
// glyph and renders as a substituted, mis-metered mess — the ⚠ that the skin
// summary appends past 20 minutes did exactly that. Everything drawn goes
// through here so one typeface behaves one way throughout.
const safe = (v) =>
  String(v ?? "")
    .replace(/⚠/g, "(!)")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "");

// Small radii: enough to soften a corner, not enough to look like a bubble.
const R_CARD = 2.5;
const R_CHIP = 1.5;

// The goal keys a surgery stores, in words a surgeon reads.
const GOAL_LABELS = {
  water: "Water (oz)",
  protein: "Protein (g)",
  bodywork: "Body work (min)"
};

const M = 40;
const LEGEND_H = 30;

export function buildRecoveryPdf({
  from,
  to,
  days,
  entries,
  patientName,
  // One or many. A single-surgery export passes one; groupBy decides whether
  // several are printed one after another or interleaved by date.
  surgeries = [],
  team = [],
  garments = [],
  medGroups = [],
  groupBy = "surgery"
}) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const L = M;
  const R = W - M;
  const BOTTOM = H - M - 18;
  let y = 0;
  let page = 0;

  // Filled in as entries are drawn, then painted into the band each page
  // reserves at the top — a legend of only what is actually on that page.
  const typesOnPage = {};
  const legendY = {};

  const footer = () => {
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.8);
    doc.line(L, H - M - 6, R, H - M - 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text("LIPNODE", L, H - M + 6);
    doc.text(String(page), R, H - M + 6, { align: "right" });
  };

  const chipWidth = (label) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    return doc.getTextWidth(safe(label)) + 14;
  };

  const chip = (x, cy, label, fillRgb, dark) => {
    const w = chipWidth(label);
    doc.setFillColor(...fillRgb);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.7);
    doc.roundedRect(x, cy - 8, w, 12, R_CHIP, R_CHIP, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...(dark ? INK : [255, 255, 255]));
    doc.text(safe(label), x + 7, cy);
    return w + 4;
  };

  const startPage = (first) => {
    page += 1;
    typesOnPage[page] = typesOnPage[page] || new Set();
    y = M;

    if (first) {
      doc.setFillColor(...INK);
      doc.roundedRect(L, y, R - L, 70, R_CARD, R_CARD, "F");
      y += 29;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text("LIPNODE", L + 16, y);
      doc.setFillColor(...PINK);
      doc.rect(L + 16, y + 6, 88, 4, "F");
      y += 24;
      doc.setFontSize(9.5);
      doc.text(patientName ? patientName.toUpperCase() : "PATIENT NOT NAMED", L + 16, y);
      doc.text(`${fullDate(from)}  —  ${fullDate(to)}`, R - 16, y, { align: "right" });
      y += 26;
    }

    // Reserve the legend band; it is painted once the page's types are known.
    legendY[page] = y;
    y += LEGEND_H;
    footer();
  };

  const ensure = (h) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      startPage(false);
    }
  };

  const text = (s, x, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(...(opts.color || INK));
    doc.text(safe(s), x, y, opts.align ? { align: opts.align } : undefined);
  };

  // A ruled heading. Sections are what make a twenty-page export navigable.
  const section = (title) => {
    ensure(34);
    y += 6;
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.2);
    doc.line(L, y, R, y);
    y += 14;
    text(title.toUpperCase(), L, { bold: true, size: 12 });
    y += 12;
  };

  const kv = (label, value) => {
    if (value == null || value === "") return;
    ensure(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(safe(label.toUpperCase()), L + 4, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(safe(String(value)), R - L - 130);
    lines.forEach((ln, i) => {
      if (i) ensure(11);
      doc.text(ln, L + 126, y);
      if (i < lines.length - 1) y += 11;
    });
    y += 13;
  };

  const bullets = (items) => {
    if (!items.length) {
      ensure(13);
      text("None recorded.", L + 4, { size: 9, color: GREY });
      y += 12;
      return;
    }
    items.forEach((line) => {
      ensure(13);
      text(`\u2022  ${line}`, L + 6, { size: 9.5 });
      y += 12;
    });
  };

  // A plain line chart. One scale, ticks that name values the data reaches, and
  // every series drawn inside the box.
  const chart = (title, labels, series, max) => {
    const h = 96;
    ensure(h + 40);
    text(title, L, { bold: true, size: 9.5 });
    y += 8;
    const x0 = L + 26;
    const x1 = R - 8;
    const y0 = y;
    const y1 = y + h;
    const span = Math.max(labels.length - 1, 1);
    const px = (i) => x0 + (i * (x1 - x0)) / span;
    const py = (v) => y1 - (Math.max(0, Math.min(v, max)) / max) * h;

    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GREY);
    [0, max / 2, max].forEach((v) => {
      doc.line(x0, py(v), x1, py(v));
      doc.text(String(Math.round(v)), L + 20, py(v) + 2, { align: "right" });
    });

    series.forEach((sr) => {
      doc.setDrawColor(...sr.color);
      doc.setLineWidth(1.2);
      let prev = null;
      sr.values.forEach((v, i) => {
        if (v == null) {
          prev = null;
          return;
        }
        const cur = [px(i), py(v)];
        if (prev) doc.line(prev[0], prev[1], cur[0], cur[1]);
        prev = cur;
      });
    });

    y = y1 + 10;
    doc.setFontSize(6.5);
    doc.setTextColor(...GREY);
    doc.text(safe(labels[0] || ""), x0, y);
    if (labels.length > 1) doc.text(safe(labels[labels.length - 1]), x1, y, { align: "right" });
    y += 10;

    let lx = L + 2;
    series.forEach((sr) => {
      lx += chip(lx, y, sr.name.toUpperCase(), sr.color, sr.dark);
    });
    y += 16;
  };

  startPage(true);

  const surgeryById = {};
  surgeries.forEach((sx) => {
    surgeryById[sx.id] = sx;
  });
  const dateOf = (surgeryId) => surgeryById[surgeryId]?.surgery_date || null;

  const dayMap = {};
  days.forEach((d) => {
    dayMap[d.date] = d;
  });
  const byDate = {};
  entries.forEach((e) => {
    (byDate[e.date] = byDate[e.date] || []).push(e);
  });

  // ---- Reference: the standing facts a surgeon needs beside the days ----

  if (surgeries.length) {
    section(surgeries.length === 1 ? "Surgery" : "Surgeries");
    surgeries.forEach((sx, i) => {
      if (i) y += 4;
      ensure(16);
      text(sx.label || "Unnamed surgery", L, { bold: true, size: 10.5 });
      y += 13;
      kv("Date", sx.surgery_date ? `${fullDate(sx.surgery_date)}${sx.surgery_time ? ` at ${sx.surgery_time}` : ""}` : "not set");
      kv("Procedure", sx.procedure);
      kv("Surgeon", sx.surgeon);
      kv("Office", sx.office_phone);
      kv("Call if fever over", sx.fever_threshold != null ? `${sx.fever_threshold} F` : null);
      kv("Notes", sx.notes);

      const goals = sx.goals || {};
      const goalLines = Object.entries(goals)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `${GOAL_LABELS[k] || k}: ${v}`);
      if (goalLines.length) kv("Goals", goalLines.join("   ·   "));
    });
  }

  if (team.length) {
    section("Care team");
    bullets(
      team.map((m) => {
        const name = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
        return `${name || m.email}${name ? `  ${m.email}` : ""}${m.can_write === false ? "  (read only)" : ""}`;
      })
    );
  }

  if (garments.length) {
    section("Garments");
    bullets(garments.map((g) => `${g.name}${g.size ? `  ${g.size}` : ""}`));
  }

  if (medGroups.length) {
    section("Med groups");
    medGroups.forEach((g) => {
      ensure(14);
      text(g.name, L + 2, { bold: true, size: 9.5 });
      y += 12;
      bullets(
        (g.medicines || []).map((m) =>
          [m.name, m.dose, m.reason].filter(Boolean).join("  ·  ")
        )
      );
    });
  }

  // ---- Trends: the same three lines and two totals the app plots ----

  const trendDates = dateRange(from, to).filter((d) => (byDate[d] || []).length);
  if (trendDates.length > 1) {
    const avg = (date, key) => {
      const vals = (byDate[date] || [])
        .filter((e) => e.type === "checkin" && Number.isFinite(e.data?.[key]))
        .map((e) => e.data[key]);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const labels = trendDates.map((d) => fullDate(d));

    section("Trends");
    chart(
      "Check-in scores, daily average",
      labels,
      [
        { name: "Pain", color: RED, dark: false, values: trendDates.map((d) => avg(d, "pain")) },
        { name: "Energy", color: LIME, dark: true, values: trendDates.map((d) => avg(d, "energy")) },
        { name: "Mood", color: PURPLE, dark: false, values: trendDates.map((d) => avg(d, "mood")) }
      ],
      10
    );

    const totalsFor = (d) => computeTotals(sortEntries(byDate[d] || []), d);
    chart(
      "Water and protein against a 100 target",
      labels,
      [
        { name: "Water oz", color: PINK, dark: false, values: trendDates.map((d) => totalsFor(d).water) },
        { name: "Protein g", color: PURPLE, dark: false, values: trendDates.map((d) => totalsFor(d).protein) }
      ],
      100
    );
  }

  if (surgeries.length || team.length || garments.length || medGroups.length || trendDates.length > 1) {
    section("Day by day");
  }

  let printed = 0;

  // Grouped, each surgery gets its own run of days. Interleaved, every day is in
  // date order and the band says which surgery it belongs to. With one surgery
  // the two are the same thing.
  const groups =
    groupBy === "surgery" && surgeries.length > 1
      ? surgeries.map((sx) => ({ surgery: sx, ids: new Set([sx.id]) }))
      : [{ surgery: null, ids: null }];

  groups.forEach((group, gi) => {
    if (group.surgery) {
      if (gi) y += 6;
      section(group.surgery.label || "Unnamed surgery");
    }

    dateRange(from, to).forEach((date) => {
    const inGroup = (r) => !group.ids || group.ids.has(r.surgery_id);
    const day = dayMap[date] && inGroup(dayMap[date]) ? dayMap[date] : null;
    const dayEntries = sortEntries((byDate[date] || []).filter(inGroup));
    if (!day && dayEntries.length === 0) return;
    printed += 1;
    const totals = computeTotals(dayEntries, date);

    // Which surgery this day counts from. In a group it is the group's; in a
    // timeline it is whatever the day itself is filed under.
    const sxId = group.surgery?.id || day?.surgery_id || dayEntries[0]?.surgery_id || null;
    const sx = surgeryById[sxId] || null;

    ensure(46);
    doc.setFillColor(...PINK);
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.4);
    doc.roundedRect(L, y, R - L, 24, R_CARD, R_CARD, "FD");
    y += 16;
    text((postOpLabel(dateOf(sxId), date) || "Surgery date not set").toUpperCase(), L + 12, {
      bold: true,
      size: 11.5,
      color: [255, 255, 255]
    });
    text(
      surgeries.length > 1 && !group.surgery && sx?.label
        ? `${sx.label}  ·  ${fullDate(date)}`
        : fullDate(date),
      R - 12,
      { bold: true, size: 8.5, color: [255, 255, 255], align: "right" }
    );
    y += 19;

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
        x += chip(x, y, v, PAPER, true);
      });
      y += 15;
    }

    if (dayEntries.length === 0) {
      ensure(16);
      text("Nothing logged this day.", L + 4, { size: 9, color: GREY });
      y += 14;
    }

    dayEntries.forEach((e) => {
      const cfg = TYPES[e.type];
      if (!cfg) return;
      const d = e.data || {};
      const summary = safe(`${cfg.summary(d, e, null)}${e.note ? ` - ${e.note}` : ""}`);
      const avail = R - L - 64;

      // The type's name leads in bold, the detail follows in regular.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const labelW = doc.getTextWidth(safe(`${cfg.label}  `));
      doc.setFont("helvetica", "normal");
      const firstFit = doc.splitTextToSize(summary, Math.max(avail - labelW, 60));
      const line1 = firstFit[0] || "";
      const rest = summary.slice(line1.length).trim();
      const restLines = rest ? doc.splitTextToSize(rest, avail) : [];

      ensure((1 + restLines.length) * 11 + 6);
      typesOnPage[page].add(e.type);

      doc.setFillColor(...hex(cfg.color));
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.7);
      doc.circle(L + 8, y - 3, 3.2, "FD");

      text(e.entry_time, L + 17, { bold: true, size: 8.5 });
      text(cfg.label, L + 62, { bold: true, size: 9 });
      if (line1) text(line1, L + 62 + labelW, { size: 9 });
      restLines.forEach((ln) => {
        y += 11;
        text(ln, L + 62, { size: 9 });
      });
      y += 13;
    });

    ensure(28);
    doc.setFillColor(...LIME);
    doc.setDrawColor(...INK);
    doc.setLineWidth(1);
    doc.roundedRect(L, y - 2, R - L, 18, R_CHIP, R_CHIP, "FD");
    y += 10;
    text(
      `WATER ${totals.water}/100oz   ·   PROTEIN ${totals.protein}/100g   ·   GARMENT ${(totals.garmentMin / 60).toFixed(1)}h   ·   MOVEMENT ${totals.walks}   ·   SLEEP ${(totals.sleepH + totals.napH).toFixed(1)}h`,
      L + 10,
      { bold: true, size: 7.5 }
    );
    y += 15;

    const answers = day?.red_flag_answers || {};
    const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");
    if (Object.keys(answers).length > 0) {
      if (yesKeys.length === 0) {
        ensure(14);
        text("Red flags checked — none.", L + 4, { size: 8.5, color: GREY });
        y += 13;
      } else {
        yesKeys.forEach((k) => {
          const det = (day.red_flag_details || {})[k] || {};
          const label = RED_FLAG_ITEMS.find((i) => i.key === k)?.label || k;
          const line = `${label}${det.time ? ` at ${det.time}` : ""}${det.office_called ? " · office called" : ""}`;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(safe(line), R - L - 74);
          ensure(lines.length * 11 + 12);
          doc.setFillColor(...RED);
          doc.setDrawColor(...INK);
          doc.setLineWidth(1);
          doc.roundedRect(L, y - 9, R - L, lines.length * 11 + 8, R_CHIP, R_CHIP, "FD");
          y += 3;
          text("RED FLAG", L + 10, { bold: true, size: 7.5, color: [255, 255, 255] });
          lines.forEach((ln, i) => {
            text(ln, L + 66, { bold: true, size: 9, color: [255, 255, 255] });
            if (i < lines.length - 1) y += 11;
          });
          y += 17;
        });
      }
    }

    (day?.questions || []).forEach((q) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(safe(`Q for surgeon: ${q}`), R - L - 20);
      ensure(lines.length * 11 + 4);
      lines.forEach((ln, i) => {
        text(ln, L + 6, { size: 9, color: PURPLE });
        if (i < lines.length - 1) y += 11;
      });
      y += 13;
    });

    y += 8;
    });
  });

  if (printed === 0) {
    doc.setDrawColor(...INK);
    doc.setLineWidth(1.4);
    doc.roundedRect(L, y, R - L, 46, R_CARD, R_CARD, "D");
    y += 22;
    text("Nothing logged in this range.", L + 14, { bold: true, size: 11 });
    y += 15;
    text("Pick a wider range on the Profile page.", L + 14, { size: 9, color: GREY });
  }

  // Paint each page's legend now that we know what that page contains.
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    const used = [...(typesOnPage[p] || [])];
    doc.setPage(p);
    y = legendY[p] + 10;
    if (used.length === 0) continue;
    let x = L + 2;
    used.forEach((t) => {
      const cfg = TYPES[t];
      if (!cfg) return;
      const label = cfg.label.toUpperCase();
      if (x + chipWidth(label) > R) {
        x = L + 2;
        y += 15;
      }
      x += chip(x, y, label, hex(cfg.color), !!cfg.darkText);
    });
  }

  return doc;
}
