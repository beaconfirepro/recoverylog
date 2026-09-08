// RxNorm, the NIH's drug vocabulary. Free, no key, no registration.
//
// Everything below talks to RxNav directly from the browser. If RxNav does not
// send CORS headers the fetch fails and searchDrugs throws, which the lookup
// shows as "the drug lookup could not be reached" — it never falls back to a
// half-answer, because a wrong medicine name in a surgical record is worse than
// no lookup at all. Point RXNAV at a proxy on the app's own origin and the rest
// of this file is unchanged.
const RXNAV = "https://rxnav.nlm.nih.gov/REST";

const get = async (path) => {
  const res = await fetch(`${RXNAV}${path}`);
  if (!res.ok) throw new Error(`RxNav ${res.status}`);
  return res.json();
};

// The prescribable subset rather than all of RxNorm: it is what a pharmacy can
// actually dispense today, so it does not offer her a discontinued product.
const drugsFor = (term) => get(`/Prescribe/drugs.json?name=${encodeURIComponent(term)}`);

// Branded and clinical drugs carry the strength in the name, which is the thing
// she needs to match against the bottle. The ingredient on its own does not.
const NAMED = ["SBD", "SCD", "BPCK", "GPCK"];

const flatten = (json) =>
  (json?.drugGroup?.conceptGroup || [])
    .filter((g) => NAMED.includes(g.tty))
    .flatMap((g) => g.conceptProperties || [])
    .map((c) => ({ rxcui: c.rxcui, name: c.name }));

// Deduplicated by name: RxNorm lists the same product under several concepts
// and a list with "Tylenol 500 MG Oral Tablet" four times is not a choice.
const unique = (rows) => {
  const seen = new Set();
  return rows.filter((r) => !seen.has(r.name) && seen.add(r.name));
};

// A misspelling is the normal case when you are typing a drug name off a bottle
// at 3am, so a miss asks RxNorm what she probably meant and searches that.
export async function searchDrugs(term, limit = 12) {
  const q = term.trim();
  if (q.length < 3) return [];

  const direct = unique(flatten(await drugsFor(q)));
  if (direct.length) return direct.slice(0, limit);

  const suggestions = (await get(`/spellingsuggestions.json?name=${encodeURIComponent(q)}`))
    ?.suggestionGroup?.suggestionList?.suggestion;
  if (!suggestions?.length) return [];

  return unique(flatten(await drugsFor(suggestions[0]))).slice(0, limit);
}
