// An invitation you have not opened yet shows enough to recognise the one you
// were expecting, and not enough to learn a patient's name from an email you
// should not have.
//
// What opens it is the join code in @/lib/joinCode. This file only decides how
// much of a name an unopened invitation is allowed to say.

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
