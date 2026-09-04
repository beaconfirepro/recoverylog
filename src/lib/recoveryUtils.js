import { format, parseISO, isToday as dfIsToday } from 'date-fns';
import { ENTRY_TYPE_MAP } from './recoveryConfig';

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export const fmtTime = (ts) => {
  if (!ts) return '';
  try {
    return format(parseISO(ts), 'h:mm a');
  } catch {
    return '';
  }
};

export const fmtDate = (d) => {
  if (!d) return '';
  try {
    return format(parseISO(d), 'EEE, MMM d');
  } catch {
    return d;
  }
};

export const fmtDateLong = (d) => {
  if (!d) return '';
  try {
    return format(parseISO(d), 'EEEE, MMMM d, yyyy');
  } catch {
    return d;
  }
};

export const nowISO = () => new Date().toISOString();

export const isToday = (d) => d === todayStr();

// Running totals up to a given entry index (inclusive) for water ounces and protein grams.
export const runningTotals = (entries, idx) => {
  let water = 0;
  let protein = 0;
  for (let i = 0; i <= idx; i++) {
    const e = entries[i];
    if (e.type === 'water') water += Number(e.data?.ounces) || 0;
    if (e.type === 'food') protein += Number(e.data?.protein) || 0;
  }
  return { waterTotal: water, proteinTotal: protein };
};

export const markerFor = (entry, entries, idx) => {
  const type = ENTRY_TYPE_MAP[entry.type];
  if (!type) return '';
  const h = { timeStr: fmtTime(entry.timestamp), ...runningTotals(entries, idx) };
  try {
    return type.marker(entry.data || {}, h);
  } catch {
    return type.abbr;
  }
};

// Summarize an entry's data into a short middle-column string.
export const entrySummary = (entry) => {
  const d = entry.data || {};
  const parts = [];
  switch (entry.type) {
    case 'checkin':
      parts.push(`P${d.pain ?? '-'} N${d.nausea ?? '-'} S${d.swelling ?? '-'}`);
      parts.push(`E${d.energy ?? '-'} M${d.mood ?? '-'} Mob${d.mobility ?? '-'}`);
      if (d.worst_spot) parts.push(d.worst_spot);
      break;
    case 'urine':
      parts.push([d.size, d.color].filter(Boolean).join(' '));
      if (d.other?.length) parts.push(d.other.join(', '));
      break;
    case 'bm':
      parts.push([d.consistency, d.ease, d.blood].filter(Boolean).join(' · '));
      break;
    case 'water':
      parts.push(`${d.ounces ?? ''}oz ${d.type || ''}`);
      break;
    case 'food':
      parts.push(d.description || '');
      if (d.protein) parts.push(`${d.protein}g`);
      if (d.appetite) parts.push(`appetite ${d.appetite}`);
      if (d.how_down) parts.push(d.how_down);
      break;
    case 'med':
      parts.push([d.drug, d.dose].filter(Boolean).join(' '));
      if (d.reason) parts.push(`(${d.reason})`);
      break;
    case 'pain_recheck':
      parts.push(`${d.pain ?? ''}/10`);
      if (d.quality?.length) parts.push(d.quality.join(', '));
      if (d.worse_with?.length) parts.push(`↑ ${d.worse_with.join(', ')}`);
      break;
    case 'temp':
      parts.push(`${d.temp ?? ''}°`);
      if (d.flags?.length) parts.push(d.flags.join(', '));
      break;
    case 'garment':
      parts.push([d.state, d.fit].filter(Boolean).join(' · '));
      if (d.behaviour?.length) parts.push(d.behaviour.join(', '));
      if (d.feel?.length) parts.push(`feel: ${d.feel.join(', ')}`);
      break;
    case 'skin':
      parts.push([d.marks, d.color].filter(Boolean).join(' · '));
      if (d.faded_minutes != null) parts.push(`faded ${d.faded_minutes}m`);
      break;
    case 'pads':
      parts.push(`${d.count ?? ''} changed`);
      if (d.amount) parts.push(d.amount);
      if (d.color) parts.push(d.color);
      if (d.odor) parts.push(`odor ${d.odor}`);
      break;
    case 'incisions':
      parts.push([d.state, d.edges, d.skin].filter(Boolean).join(' · '));
      if (d.odor) parts.push(`odor ${d.odor}`);
      break;
    case 'walk':
      parts.push([d.minutes ? `${d.minutes}m` : '', d.distance].filter(Boolean).join(' '));
      if (d.help) parts.push(`help ${d.help}`);
      if (d.during?.length) parts.push(d.during.join(', '));
      if (d.calf) parts.push(`calf ${d.calf}`);
      break;
    case 'sleep':
      parts.push([d.hours ? `${d.hours}h` : '', d.minutes ? `${d.minutes}m` : ''].filter(Boolean).join(' '));
      if (d.position) parts.push(d.position);
      if (d.quality) parts.push(d.quality);
      if (d.woke_for?.length) parts.push(`woke: ${d.woke_for.join(', ')}`);
      break;
    case 'mld':
      parts.push(`${d.minutes ?? ''}m ${d.who || ''}`);
      if (d.areas) parts.push(d.areas);
      if (d.after?.length) parts.push(d.after.join(', '));
      break;
    case 'photos':
      parts.push(d.note || 'photos taken');
      break;
    case 'measurements':
      parts.push('measurements logged');
      break;
    case 'weight':
      parts.push(`${d.weight ?? ''}`);
      break;
    default:
      break;
  }
  if (entry.note) parts.push(`· ${entry.note}`);
  return parts.filter(Boolean).join('  ');
};

// Compute the day's auto totals from entries + header.
export const computeTotals = (entries, day) => {
  let water = 0;
  let protein = 0;
  let walkCount = 0;
  let sleepExtra = 0; // hours from sleep/nap entries
  let tempPm = day?.temp_pm ?? null;
  let garmentMs = 0;
  let onAt = null;

  const sorted = [...entries].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  sorted.forEach((e) => {
    const d = e.data || {};
    if (e.type === 'water') water += Number(d.ounces) || 0;
    if (e.type === 'food') protein += Number(d.protein) || 0;
    if (e.type === 'walk') walkCount += 1;
    if (e.type === 'sleep') sleepExtra += (Number(d.hours) || 0) + (Number(d.minutes) || 0) / 60;
    if (e.type === 'temp') {
      const hour = new Date(e.timestamp).getHours();
      if (hour >= 12) tempPm = d.temp;
    }
    if (e.type === 'garment') {
      if (d.state === 'on' && !onAt) onAt = new Date(e.timestamp);
      if (d.state === 'off' && onAt) {
        garmentMs += new Date(e.timestamp) - onAt;
        onAt = null;
      }
    }
  });
  if (onAt) garmentMs += Date.now() - onAt; // still on
  const garmentHours = Math.round((garmentMs / 3600000) * 10) / 10;

  // Best / worst check-in by composite score (higher = better).
  const checkins = sorted.filter((e) => e.type === 'checkin');
  let best = null, worst = null;
  checkins.forEach((e) => {
    const d = e.data || {};
    const good = ((Number(d.energy) || 0) + (Number(d.mood) || 0) + (Number(d.mobility) || 0)) / 3;
    const bad = ((Number(d.pain) || 0) + (Number(d.nausea) || 0) + (Number(d.swelling) || 0)) / 3;
    const score = good - bad;
    if (!best || score > best.score) best = { score, time: fmtTime(e.timestamp), d };
    if (!worst || score < worst.score) worst = { score, time: fmtTime(e.timestamp), d };
  });

  const sleepTotal = Math.round(((Number(day?.slept_hours) || 0) + sleepExtra) * 10) / 10;

  return {
    water_total: water,
    protein_total: protein,
    garment_hours: garmentHours,
    walk_count: walkCount,
    sleep_total: sleepTotal,
    temp_pm: tempPm,
    best_checkin: best,
    worst_checkin: worst,
  };
};

export const scoreCheckin = (d) => {
  if (!d) return null;
  const good = ((Number(d.energy) || 0) + (Number(d.mood) || 0) + (Number(d.mobility) || 0)) / 3;
  const bad = ((Number(d.pain) || 0) + (Number(d.nausea) || 0) + (Number(d.swelling) || 0)) / 3;
  return Math.round((good - bad) * 10) / 10;
};