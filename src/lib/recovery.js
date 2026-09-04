import {
  ClipboardList, Droplets, Utensils, Pill, Zap, Thermometer, Droplet, Bath,
  Layers, Stethoscope, Shirt, Hand, Footprints, Moon, Waves, Camera, Ruler, Scale
} from "lucide-react";

const S = (key, label, lowIs) => ({ key, label, kind: "scale", lowIs });
const join = (parts) => parts.filter((p) => p !== null && p !== undefined && p !== "").join(" · ");

export const TYPES = {
  checkin: {
    label: "Check-in", icon: ClipboardList, color: "#FF2E88",
    fields: [
      { key: "slot", label: "Slot", kind: "chips", options: ["Waking", "Midday", "Evening", "Bedtime"] },
      S("pain", "Pain", "bad"), S("nausea", "Nausea", "bad"), S("swelling", "Swelling", "bad"),
      S("energy", "Energy", "good"), S("mood", "Mood", "good"), S("mobility", "Mobility", "good"),
      { key: "worst_spot", label: "Worst spot", kind: "text", placeholder: "e.g. left hip" }
    ],
    summary: (d) => join([d.slot, `Pain ${d.pain ?? "–"}`, `Nausea ${d.nausea ?? "–"}`, `Swelling ${d.swelling ?? "–"}`, `Energy ${d.energy ?? "–"}`, `Mood ${d.mood ?? "–"}`, `Mobility ${d.mobility ?? "–"}`, d.worst_spot && `Worst: ${d.worst_spot}`]),
    marker: (d, e) => `CHK ${e.entry_time}`
  },
  water: {
    label: "Water", icon: Droplets, color: "#00B4D8",
    fields: [
      { key: "ounces", label: "Ounces", kind: "number", steps: [4, 8, 12, 16, 20, 24, 32] },
      { key: "type", label: "Type", kind: "chips", options: ["water", "electrolyte", "broth", "other"] }
    ],
    summary: (d) => join([`${d.ounces ?? "?"} oz`, d.type || "water"]),
    marker: (d, e, run) => `OZ ${run ? run.water : d.ounces ?? 0}`
  },
  food: {
    label: "Food", icon: Utensils, color: "#FF9E00", darkText: true,
    fields: [
      { key: "description", label: "Description", kind: "text", placeholder: "what did you eat?" },
      { key: "protein", label: "Protein (g)", kind: "number", steps: [5, 10, 15, 20, 25, 30] },
      { key: "appetite", label: "Appetite", kind: "chips", options: ["none", "low", "normal", "famished"] },
      { key: "tolerance", label: "How it went down", kind: "chips", options: ["fine", "slow", "nausea", "vomited"] }
    ],
    summary: (d) => join([d.description, d.protein != null && `${d.protein}g protein`, d.appetite && `appetite: ${d.appetite}`, d.tolerance && `went down: ${d.tolerance}`]),
    marker: (d, e, run) => `${run ? run.protein : d.protein ?? 0}g`
  },
  med: {
    label: "Med", icon: Pill, color: "#9B5DE5",
    fields: [
      { key: "drug", label: "Drug", kind: "text", placeholder: "e.g. Tylenol 500mg" },
      { key: "dose", label: "Dose", kind: "text", placeholder: "e.g. 2 pills" },
      { key: "reason", label: "Reason", kind: "text", placeholder: "e.g. pain" },
      { key: "next_allowed", label: "Next allowed time", kind: "time" }
    ],
    summary: (d) => join([d.drug, d.dose, d.reason, d.next_allowed && `next: ${d.next_allowed}`]),
    marker: (d, e) => `MED ${e.entry_time}`
  },
  pain: {
    label: "Pain recheck", icon: Zap, color: "#FF5400",
    fields: [
      S("pain", "Pain", "bad"),
      { key: "quality", label: "Quality", kind: "chips", options: ["aching", "burning", "stabbing", "throbbing", "tight", "pulling", "zinging", "numb"] },
      { key: "worse_with", label: "Worse with", kind: "chipsMulti", options: ["standing", "walking", "coughing", "twisting", "garment"] }
    ],
    summary: (d) => join([`Pain ${d.pain ?? "–"}`, d.quality, (d.worse_with || []).join(", ")]),
    marker: (d) => `PAIN ${d.pain ?? ""}`
  },
  temp: {
    label: "Temp", icon: Thermometer, color: "#FF006E",
    fields: [
      { key: "temp", label: "Temperature (°F)", kind: "number", decimal: true, placeholder: "98.6" },
      { key: "symptoms", label: "Symptoms", kind: "chipsMulti", options: ["chills", "sweats", "flushed", "shivering"] }
    ],
    summary: (d) => join([`${d.temp ?? "?"}°F`, (d.symptoms || []).join(", ")]),
    marker: (d) => `TEMP ${d.temp ?? ""}`
  },
  urine: {
    label: "Urine", icon: Droplet, color: "#FFD60A", darkText: true,
    fields: [
      { key: "size", label: "Size", kind: "chips", options: ["S", "M", "L"] },
      { key: "color", label: "Color", kind: "chips", options: ["clear", "pale", "yellow", "dark yellow", "amber", "tea", "pink", "red"] },
      { key: "other", label: "Other", kind: "chipsMulti", options: ["burning", "urgency", "hard to start"] }
    ],
    summary: (d) => join([d.size, d.color, (d.other || []).join(", ")]),
    marker: () => "UR"
  },
  bm: {
    label: "BM", icon: Bath, color: "#6D4C2F",
    fields: [
      { key: "consistency", label: "Consistency", kind: "chips", options: ["soft", "formed", "hard", "loose", "watery"] },
      { key: "ease", label: "Ease", kind: "chips", options: ["easy", "straining", "painful"] },
      { key: "blood", label: "Blood", kind: "chips", options: ["none", "streaks", "dark"] }
    ],
    summary: (d) => join([d.consistency, d.ease, d.blood && `blood: ${d.blood}`]),
    marker: () => "BM"
  },
  pads: {
    label: "Pads / drainage", icon: Layers, color: "#F15BB5",
    fields: [
      { key: "count", label: "Pads changed", kind: "number", steps: [1, 2, 3, 4] },
      { key: "amount", label: "Amount", kind: "chips", options: ["spotting", "light", "half soaked", "soaked", "through to clothes"] },
      { key: "color", label: "Color", kind: "chips", options: ["bright red", "dark red", "pink", "watery pink", "straw", "clear", "yellow", "green"] },
      { key: "odor", label: "Odor", kind: "chips", options: ["none", "foul"] }
    ],
    summary: (d) => join([d.count != null && `×${d.count}`, d.amount, d.color, d.odor && `odor: ${d.odor}`]),
    marker: (d) => `PADS ×${d.count || 0} ${(d.color || "").split(" ")[0]}`
  },
  incisions: {
    label: "Incisions", icon: Stethoscope, color: "#FB5607",
    fields: [
      { key: "closure", label: "Closure", kind: "chips", options: ["closed", "open", "gaping", "weeping"] },
      { key: "edges", label: "Edges", kind: "chips", options: ["together", "separating"] },
      { key: "skin", label: "Skin", kind: "chips", options: ["normal", "pink", "red", "hot", "hard", "spreading"] },
      { key: "odor", label: "Odor", kind: "chips", options: ["none", "foul"] }
    ],
    summary: (d) => join([d.closure, d.edges && `edges: ${d.edges}`, d.skin, d.odor && `odor: ${d.odor}`]),
    marker: () => "INC"
  },
  garment: {
    label: "Garment / foam", icon: Shirt, color: "#06D6A0",
    fields: [
      { key: "action", label: "Action", kind: "chips", options: ["on", "off", "adjust"] },
      { key: "fit", label: "Fit", kind: "chips", options: ["loose", "right", "tight", "cutting in"] },
      { key: "behaviour", label: "Behaviour", kind: "chipsMulti", options: ["rolling", "bunching", "sliding", "seam pressure"] },
      { key: "underneath", label: "Feel underneath", kind: "chips", options: ["fine", "numb", "tingling", "burning", "pins and needles"] }
    ],
    summary: (d) => join([d.action, d.fit, (d.behaviour || []).join(", "), d.underneath]),
    marker: (d) => `GAR ${d.action || ""}`
  },
  skin: {
    label: "Skin under garment", icon: Hand, color: "#FF7BAC",
    fields: [
      { key: "marks", label: "Marks", kind: "chips", options: ["none", "lines", "indents", "blister", "broken skin"] },
      { key: "color", label: "Color", kind: "chips", options: ["normal", "pink", "red", "purple", "white", "mottled"] },
      { key: "faded_min", label: "Faded in minutes (flag if 20+)", kind: "number", steps: [5, 10, 20, 30, 60] }
    ],
    summary: (d) => join([d.marks, d.color, d.faded_min != null && `faded in ${d.faded_min} min${d.faded_min >= 20 ? " ⚠" : ""}`]),
    marker: () => "SKIN"
  },
  walk: {
    label: "Walk", icon: Footprints, color: "#4361EE",
    fields: [
      { key: "minutes", label: "Minutes", kind: "number", steps: [5, 10, 15, 20, 30] },
      { key: "distance", label: "Distance", kind: "text", placeholder: "e.g. to mailbox" },
      { key: "help", label: "Help", kind: "chips", options: ["none", "one person", "walker"] },
      { key: "during", label: "During", kind: "chipsMulti", options: ["steady", "dizzy", "breathless", "had to stop"] },
      { key: "calf", label: "Calf", kind: "chips", options: ["no pain", "pain", "swelling", "warm one side"] }
    ],
    summary: (d) => join([d.minutes != null && `${d.minutes} min`, d.distance, d.help, (d.during || []).join(", "), d.calf]),
    marker: () => "WALK"
  },
  sleep: {
    label: "Sleep / nap", icon: Moon, color: "#5A189A",
    fields: [
      { key: "kind", label: "Sleep or nap", kind: "chips", options: ["sleep", "nap"] },
      { key: "hours", label: "Hours", kind: "number", steps: [1, 2, 3, 4, 5, 6, 7, 8] },
      { key: "minutes", label: "Minutes", kind: "number", steps: [15, 30, 45] },
      { key: "position", label: "Position", kind: "chips", options: ["recliner", "wedge", "propped", "flat", "side"] },
      { key: "quality", label: "Quality", kind: "chips", options: ["solid", "broken", "restless", "none"] },
      { key: "woke_for", label: "Woke for", kind: "chipsMulti", options: ["pain", "bathroom", "nausea", "garment", "alarm"] }
    ],
    summary: (d) => {
      const h = (+d.hours || 0) + (+d.minutes || 0) / 60;
      return join([d.kind === "nap" ? "Nap" : "Sleep", h ? `${h % 1 ? h.toFixed(1) : h}h` : null, d.position, d.quality, (d.woke_for || []).join(", ")]);
    },
    marker: (d) => (d.kind === "nap" ? "NAP" : "SLEEP")
  },
  mld: {
    label: "MLD / massage", icon: Waves, color: "#B5179E",
    fields: [
      { key: "minutes", label: "Minutes", kind: "number", steps: [10, 20, 30, 45, 60] },
      { key: "who", label: "Who", kind: "chips", options: ["therapist", "self", "caregiver"] },
      { key: "areas", label: "Areas", kind: "text", placeholder: "e.g. abdomen, left thigh" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "weeping fluid", "more swollen"] }
    ],
    summary: (d) => join([d.minutes != null && `${d.minutes} min`, d.who, d.areas, (d.after || []).join(", ")]),
    marker: () => "MLD"
  },
  photo: {
    label: "Photo", icon: Camera, color: "#3A86FF",
    fields: [
      { key: "photo_url", label: "Photo", kind: "file" },
      { key: "caption", label: "Caption", kind: "text", placeholder: "e.g. incision day 3" }
    ],
    summary: (d) => join([d.caption, d.photo_url ? "photo attached" : null]),
    marker: () => "PHOTO"
  },
  measure: {
    label: "Measurements", icon: Ruler, color: "#80FFDB", darkText: true,
    fields: [{ key: "values", label: "Measurements", kind: "spots" }],
    summary: (d) => join(Object.entries(d || {}).filter(([k, v]) => v !== null && v !== "" && k !== "photo_url").map(([k, v]) => `${k}: ${v}`)),
    marker: () => "MEAS"
  },
  weight: {
    label: "Weight", icon: Scale, color: "#E0AAFF", darkText: true,
    fields: [{ key: "weight", label: "Weight (lbs)", kind: "number", decimal: true, placeholder: "142" }],
    summary: (d) => `${d.weight ?? "?"} lbs`,
    marker: (d) => `WT ${d.weight ?? ""}`
  }
};

export const QUICK_ORDER = [
  "checkin", "water", "food", "med", "pain", "temp", "sleep", "walk",
  "bm", "urine", "pads", "incisions", "garment", "skin", "mld", "photo", "measure", "weight"
];

export const RED_FLAG_ITEMS = [
  { key: "fever", label: "Fever over the surgeon's number" },
  { key: "calf", label: "Calf pain, swelling, or warmth on one side" },
  { key: "chest", label: "Chest pain or short of breath" },
  { key: "redness", label: "Redness spreading, or skin hot or hard" },
  { key: "drainage", label: "Drainage foul or pus-like" },
  { key: "bleeding", label: "Bright red bleeding restarted after slowing" },
  { key: "dizzy", label: "Dizzy on standing" },
  { key: "urine", label: "Urine dropped off or dark all day" },
  { key: "pain", label: "Pain suddenly worse, not better" },
  { key: "bowel", label: "No BM for 3+ days" },
  { key: "garment", label: "Numbness or color change under garment" },
  { key: "confusion", label: "Confused or hard to wake" }
];

export const defaultSlot = () => {
  const h = new Date().getHours();
  if (h < 11) return "Waking";
  if (h < 16) return "Midday";
  if (h < 21) return "Evening";
  return "Bedtime";
};