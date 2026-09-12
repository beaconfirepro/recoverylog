const pad = (n) => String(n).padStart(2, "0");

// The one place a Date becomes a YYYY-MM-DD string, and it reads the local
// fields to do it. toISOString() would shift the day by the timezone offset,
// which is the same off-by-one that parseDate exists to prevent at the other
// end.
export const dateStr = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => dateStr(new Date());

export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const parseDate = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

// Walking the log a day at a time. Every step goes out through parseDate and
// back through dateStr so the arithmetic happens on a local date: `new
// Date("2026-09-12")` is UTC midnight, which is 11 September in every western
// timezone, and a day walked off that lands on the wrong day. setDate rolls
// months, years and leap days over on its own, so there is nothing else to do.
export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

// A real calendar date, written the way the app writes them. A date input hands
// back whatever was typed at a keyboard, and parseDate would roll "2026-02-30"
// forward into March rather than refuse it, so the round trip is the check.
export const isDayStr = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s || "") && dateStr(parseDate(s)) === s;

// Month grouping for the Day by Day list. The key sorts with the dates it
// groups, because it is their first seven characters.
export const monthKey = (s) => (s || "").slice(0, 7);

export const monthLabel = (s) =>
  parseDate(s).toLocaleDateString(undefined, { month: "long", year: "numeric" });

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
    out.push(dateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

// Single source for the day label. Day 0 = surgery day, then post-op day N.
export const postOpLabel = (surgeryDate, date) => {
  if (!surgeryDate) return null;
  const n = daysBetween(surgeryDate, date);
  if (n < 0) return `Pre-op · ${-n} day${-n === 1 ? "" : "s"} to go`;
  if (n === 0) return "Day of Surgery";
  return `Post-op day ${n}`;
};
