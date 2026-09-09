import { BODY_PARTS } from "@/lib/bodyMap";

// The day's entries, read against the red-flag list. Only "yes" is ever
// suggested: an entry that says something worrying is evidence, but the absence
// of an entry is not evidence that nothing is wrong, so the check never answers
// "no" for her and never talks her out of a flag she would have raised.
//
// Every suggestion says which entry it came from, and she can change any of
// them; nothing here is saved until she saves the check.

const FEVER_DEFAULT = 100.4;
const CALVES = BODY_PARTS.filter((p) => p.endsWith("calf"));
const DARK_URINE = ["Brown / tea", "Pink / red"];
const BAD_INCISION = ["Redness", "Increased warmth", "Pus", "Odor", "Increased pain"];

const of = (entries, type) => entries.filter((e) => e.type === type).map((e) => e.data || {});
const flat = (rows, key) => rows.flatMap((d) => d[key] || []);
const findings = (rows) =>
  rows.flatMap((d) => Object.entries(d.findings || {}).flatMap(([area, syms]) => (syms || []).map((s) => [area, s])));
const incisions = (rows) => rows.flatMap((d) => Object.values(d.status || {}));

export function suggestFlags(entries, surgery, lastBmDate, date) {
  const s = {};
  const yes = (key, why) => {
    if (!s[key]) s[key] = { answer: "yes", why };
  };

  const threshold = surgery?.fever_threshold || FEVER_DEFAULT;
  const hot = of(entries, "temp").find((d) => +d.temp >= threshold);
  if (hot) yes("fever", `Temp ${hot.temp}°F, at or over ${threshold}`);

  const inc = incisions(of(entries, "incisions"));
  const flagged = inc.find((i) => ["Risk", "Issue"].includes(i.level));
  const sore = inc.find((i) => (i.symptoms || []).some((sym) => BAD_INCISION.includes(sym)));
  if (flagged) yes("redness", `An incision is marked ${flagged.level}`);
  else if (sore) yes("redness", `An incision reports ${sore.symptoms.filter((x) => BAD_INCISION.includes(x)).join(", ").toLowerCase()}`);

  const foul = of(entries, "drainage").find((d) => d.odor === "foul");
  const pus = inc.find((i) => (i.symptoms || []).some((sym) => ["Pus", "Odor"].includes(sym)));
  if (foul) yes("drainage", "Drainage logged as foul");
  else if (pus) yes("drainage", "An incision reports pus or odor");

  const bright = of(entries, "drainage").find((d) => d.color === "Bright Red");
  if (bright) yes("bleeding", `Drainage logged as bright red${bright.amount ? `, ${bright.amount}` : ""}`);

  const dizzy = of(entries, "movement").find((d) => (d.felt || []).includes("dizzy"));
  if (dizzy) yes("dizzy", "Movement logged as dizzy");

  const dark = of(entries, "urine").find((d) => DARK_URINE.includes(d.color));
  if (dark) yes("urine", `Urine logged as ${dark.color.toLowerCase()}`);

  const worst = Math.max(-1, ...of(entries, "checkin").map((d) => +d.pain || -1));
  if (worst >= 8) yes("pain", `A check-in put pain at ${worst}`);

  const skin = findings(of(entries, "skin"));
  const numb = skin.find(([, sym]) => ["Numbness", "Pale or cold"].includes(sym));
  if (numb) yes("garment", `${numb[0]} logged as ${numb[1].toLowerCase()}`);

  const calf = skin.find(([area]) => CALVES.includes(area));
  if (calf) yes("calf", `${calf[0]} logged as ${calf[1].toLowerCase()}`);

  // Three days is the surgeon's line, so the count has to be days between the
  // last one and this day, not entries.
  const bmToday = of(entries, "bm").length > 0;
  if (!bmToday && lastBmDate && date) {
    const days = Math.round((Date.parse(date) - Date.parse(lastBmDate)) / 86400000);
    if (days >= 3) yes("bowel", `Last BM was ${days} days ago, on ${lastBmDate}`);
  }

  // Chest pain and confusion have no tracker behind them, so they are never
  // suggested; they stay hers to answer.
  return s;
}

// What the temp, movement and skin trackers cannot see. Listed so the card can
// say plainly that these two are asked of her rather than read off the day.
export const UNTRACKED_FLAGS = ["chest", "confusion"];
