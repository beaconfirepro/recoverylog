// A patient holds one Maintenance record plus zero or more Surgery records, all
// of them Surgery rows. The "scope" is which of those the day, history, trends
// and PDF are looking at: one record, or all of them unioned by calendar date.
//
// scope = { all: boolean, ids: string[] }
//   all === true  -> every non-archived record the patient has.
//   all === false -> just the records named in ids (almost always one).
//
// It lives in localStorage next to the old active-surgery pick: scope is a
// per-device view choice, not medical data, so it does not need a round trip.

const key = (patientId) => `recoverylog.scope.${patientId || "anon"}`;

export const loadScope = (patientId) => {
  try {
    const raw = window.localStorage.getItem(key(patientId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.ids)) return parsed;
    return null;
  } catch {
    return null;
  }
};

export const saveScope = (patientId, scope) => {
  try {
    window.localStorage.setItem(key(patientId), JSON.stringify(scope));
  } catch {
    // A browser refusing storage just loses the view choice for next visit.
  }
};

export const isMaintenance = (record) => record?.mode === "maintenance";

// The maintenance record, if the patient has one.
export const maintenanceRecord = (surgeries) => surgeries.find(isMaintenance) || null;

// Surgeries the patient has cancelled. They stay out of the pickers but are
// listed in their own section on Care so the record and its reason are kept.
export const cancelledRecords = (surgeries) => surgeries.filter((s) => s.cancelled);

// Records that appear in the picker: every record that is not archived,
// maintenance first so the no-surgery baseline reads first.
export const choosableRecords = (surgeries) =>
  surgeries.filter((s) => !s.archived && !s.cancelled).sort((a, b) => {
    const am = isMaintenance(a) ? 0 : 1;
    const bm = isMaintenance(b) ? 0 : 1;
    return am - bm;
  });

// The Surgery rows the current scope covers.
export const recordsInScope = (scope, surgeries) => {
  if (!scope) return [];
  if (scope.all) return choosableRecords(surgeries);
  return surgeries.filter((s) => scope.ids.includes(s.id) && !s.archived && !s.cancelled);
};

export const isAll = (scope) => !!scope?.all;

// The default scope for a patient who has never picked one: the maintenance
// record if it exists (so a no-surgery patient lands on maintenance), else the
// first non-archived surgery.
export const defaultScope = (surgeries) => {
  const m = maintenanceRecord(surgeries);
  if (m) return { all: false, ids: [m.id] };
  const first = choosableRecords(surgeries)[0];
  return first ? { all: false, ids: [first.id] } : null;
};

// A scope read back from storage may name records that no longer exist (a
// deleted surgery, a maintenance record on a fresh install). Fall back to a
// usable scope rather than showing nothing.
export const resolveScope = (stored, surgeries) => {
  if (!stored) return defaultScope(surgeries);
  if (stored.all) return choosableRecords(surgeries).length ? stored : defaultScope(surgeries);
  const live = (stored.ids || []).filter((id) => surgeries.some((s) => s.id === id && !s.archived && !s.cancelled));
  if (!live.length) return defaultScope(surgeries);
  return { all: false, ids: live };
};

// The record new entries on a multi-record day attach to, and whose day row
// (woke-at, red flags, questions) is shown. Defaults to maintenance, because a
// day with no surgery yet is the day maintenance exists for.
export const defaultFocused = (scope, surgeries) => {
  const inScope = recordsInScope(scope, surgeries);
  if (!inScope.length) return null;
  if (inScope.length === 1) return inScope[0];
  return maintenanceRecord(inScope) || inScope[0];
};

// A short label for a record, used on chips and PDF bands.
export const recordLabel = (record) => {
  if (!record) return "";
  return isMaintenance(record) ? "Maintenance" : record.label || "Surgery";
};