// An invitation you have not opened yet shows enough to recognise the one you
// were expecting, and not enough to learn a name and a date of birth from an
// email you should not have.
//
// Pure, and apart from the care page, because getting this wrong leaks a
// patient's identity to whoever holds a mistyped address.

// First initial, then the surname's first and last letter with the middle
// struck out: "Deborah Dale" reads as "D. D__e".
export const maskedName = (row) => {
  const first = String(row?.match_first_name ?? "").trim();
  const last = String(row?.match_last_name ?? "").trim();
  const initial = first ? `${first[0].toUpperCase()}.` : "";
  // A two-letter surname would otherwise print in full, which is the whole name
  // given away.
  const surname =
    last.length > 2
      ? `${last[0]}${"_".repeat(last.length - 2)}${last[last.length - 1]}`
      : last.length === 2
        ? `${last[0]}_`
        : last;
  return [initial, surname].filter(Boolean).join(" ") || "A patient";
};

// Only the last two digits of the year survive: "1974-03-02" reads as
// "··/··/74". Stored as YYYY-MM-DD.
export const maskedDob = (row) => {
  const dob = String(row?.match_dob ?? "").trim();
  return dob.length >= 4 ? `··/··/${dob.slice(2, 4)}` : "";
};

// What a member types has to match what the patient wrote, allowing for the
// case and spacing a person actually types.
const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export const detailsMatch = (row, form) => {
  const first = norm(row?.match_first_name);
  const last = norm(row?.match_last_name);
  const dob = String(row?.match_dob ?? "").trim();
  // An invitation written before the patient filled in her own details carries
  // three empty fields. Comparing those to an empty form is true, which would
  // open the log to anyone who submitted nothing. Both button states happen to
  // prevent it today; the check belongs here rather than in two callers.
  if (!first || !last || !dob) return false;
  return (
    first === norm(form?.first_name) &&
    last === norm(form?.last_name) &&
    dob === String(form?.dob ?? "").trim()
  );
};
