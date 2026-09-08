// A list read that did not come back as a list is an empty screen, not a
// crash: the caller can say "nothing here" but it cannot survive .find on an
// object thrown from inside an effect.
export const asRows = (r) => (Array.isArray(r) ? r : []);
