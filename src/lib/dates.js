export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const parseDate = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

export const niceDate = (s) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export const shortDate = (s) => {
  const d = parseDate(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const fullDate = (s) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const daysBetween = (a, b) =>
  Math.round((parseDate(b) - parseDate(a)) / 86400000);

export const MAX_RANGE_DAYS = 120;

export const dateRange = (from, to) => {
  const out = [];
  let d = parseDate(from);
  const end = parseDate(to);
  while (d <= end && out.length < MAX_RANGE_DAYS) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

// Single source for the day label. Day 0 = surgery day, then post-op day N.
export const postOpLabel = (surgeryDate, date) => {
  if (!surgeryDate) return null;
  const n = daysBetween(surgeryDate, date);
  if (n < 0) return `Pre-op · ${-n} day${-n === 1 ? "" : "s"} to go`;
  if (n === 0) return "Surgery day";
  return `Post-op day ${n}`;
};
