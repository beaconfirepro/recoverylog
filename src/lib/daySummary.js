import { todayStr, nowTime } from "./dates";

export const timeToMin = (t) => {
  if (!t) return 0;
  const [h, m] = String(t).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const sortEntries = (list) =>
  [...list].sort((a, b) => timeToMin(a.entry_time) - timeToMin(b.entry_time) || String(a.created_date).localeCompare(String(b.created_date)));

export function runningTotals(sorted) {
  let w = 0, p = 0;
  const map = {};
  sorted.forEach((e) => {
    if (e.type === "water") w += +e.data?.ounces || 0;
    if (e.type === "food") p += +e.data?.protein || 0;
    map[e.id] = { water: w, protein: p };
  });
  return map;
}

export function computeTotals(entries, dateStr) {
  const sorted = sortEntries(entries);
  const sum = (type, key) =>
    entries.filter((e) => e.type === type).reduce((s, e) => s + (+e.data?.[key] || 0), 0);

  const water = sum("water", "ounces");
  const protein = sum("food", "protein");
  const walks = entries.filter((e) => e.type === "walk").length;

  // Garment hours: on -> off pairs, open "on" counts until now (today) or midnight
  let onAt = null, gmin = 0;
  sorted.forEach((e) => {
    if (e.type !== "garment") return;
    const a = e.data?.action;
    if (a === "on" && onAt === null) onAt = e.entry_time;
    else if (a === "off" && onAt !== null) { gmin += timeToMin(e.entry_time) - timeToMin(onAt); onAt = null; }
  });
  if (onAt !== null) {
    const end = dateStr === todayStr() ? nowTime() : "23:59";
    gmin += Math.max(0, timeToMin(end) - timeToMin(onAt));
  }

  let sleepMin = 0, napMin = 0;
  entries.forEach((e) => {
    if (e.type !== "sleep") return;
    const m = (+e.data?.hours || 0) * 60 + (+e.data?.minutes || 0);
    if (e.data?.kind === "nap") napMin += m; else sleepMin += m;
  });

  let tempAm = null, tempPm = null, weight = null, photoTaken = false, measurements = null, nextMed = null;
  sorted.forEach((e) => {
    if (e.type === "temp" && e.data?.temp != null) {
      if (timeToMin(e.entry_time) < 720) tempAm = e.data.temp; else tempPm = e.data.temp;
    }
    if (e.type === "weight" && e.data?.weight != null) weight = e.data.weight;
    if (e.type === "photo" && e.data?.photo_url) photoTaken = true;
    if (e.type === "measure" && e.data) measurements = e.data;
    if (e.type === "med" && e.data?.next_allowed) nextMed = { drug: e.data.drug, time: e.data.next_allowed };
  });

  let best = null, worst = null;
  entries.forEach((e) => {
    if (e.type !== "checkin") return;
    const d = e.data || {};
    const good = ((+d.energy || 0) + (+d.mood || 0) + (+d.mobility || 0)) / 3;
    const bad = ((+d.pain || 0) + (+d.nausea || 0) + (+d.swelling || 0)) / 3;
    const item = { slot: d.slot || "—", time: e.entry_time, score: good - bad };
    if (!best || item.score > best.score) best = item;
    if (!worst || item.score < worst.score) worst = item;
  });

  return {
    water, protein, walks,
    garmentMin: gmin,
    sleepH: sleepMin / 60, napH: napMin / 60,
    tempAm, tempPm, weight, photoTaken, measurements, nextMed, best, worst,
    checkins: entries.filter((e) => e.type === "checkin").length
  };
}

export function lastBmInfo(lastBmEntry, todayDate) {
  if (!lastBmEntry) return "—";
  if (lastBmEntry.date === todayDate) return `Today ${lastBmEntry.entry_time}`;
  return lastBmEntry.date;
}

export function redFlagYesCount(day) {
  const answers = day?.red_flag_answers || {};
  return Object.values(answers).filter((v) => v === "yes").length;
}