// Turning a typed hour, minutes and AM/PM into the 24-hour "HH:MM" the app
// stores, and back. Pure, and apart from the control, because midnight and noon
// are where clock code goes wrong and a wrong time on a medication entry is
// worth a test.

export const pad = (n) => String(n).padStart(2, "0");

export const digits = (v, max) => String(v).replace(/\D/g, "").slice(0, max);

// "13:05" reads as 1:05 PM. 00:xx is 12 AM and 12:xx is 12 PM, which is the
// pair that catches naive modulo arithmetic.
export const parseTime = (v) => {
  const [H, M] = String(v || "").split(":").map(Number);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return { h: "", m: "", pm: false };
  return { h: String(H % 12 === 0 ? 12 : H % 12), m: pad(M), pm: H >= 12 };
};

export const composeTime = (h, m, pm) => {
  const H = Number(h);
  const M = Number(m);
  if (!Number.isFinite(H) || !Number.isFinite(M) || h === "" || m === "") return "";
  const h24 = pm ? (H % 12) + 12 : H % 12;
  return `${pad(h24)}:${pad(M)}`;
};
