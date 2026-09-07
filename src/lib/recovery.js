import {
  ClipboardList, Droplets, Utensils, Pill, Zap, Thermometer, Droplet, Bath,
  Layers, Stethoscope, Shirt, Hand, Activity, Moon, Waves, Camera, Ruler, Scale,
  Brush, HeartHandshake, Vibrate
} from "lucide-react";

// What each level actually means, in the patient's words rather than "10 = worst".
// Pain follows the standard functional anchors, where a level is defined by what
// it stops you doing; the rest have no agreed wording and are ours.
const LEVELS = {
  pain: [
    "No pain at all",
    "Barely there, easy to ignore",
    "Noticeable, but I forget about it",
    "Annoying, and I still do what I want",
    "Distracting, I have to slow down",
    "Hard to ignore, I stop and reset",
    "It interferes with most things I try",
    "It dominates, I can't concentrate",
    "I can't do much except lie still",
    "I can barely think or move",
    "Constant pain so bad I can't speak through it"
  ],
  nausea: [
    "No nausea",
    "A faint flicker of it",
    "Queasy if I move too fast",
    "Queasy, but I can still eat",
    "Off food, sipping only",
    "Queasy the whole time",
    "Gagging, I can't face food",
    "Retching on and off",
    "Being sick, can't keep water down",
    "Dry heaving with nothing left",
    "I can't stop being sick"
  ],
  swelling: [
    "Nothing, back to normal",
    "Slightly puffy first thing",
    "Visible, but still soft",
    "Clothes feel snug",
    "Tight, and the skin looks shiny",
    "Hard to bend or sit comfortably",
    "The garment leaves deep marks",
    "Heavy, and hot to touch",
    "Skin taut, painful to press",
    "Too swollen to wear the garment",
    "Worse than any day so far"
  ],
  energy: [
    "Can't get out of bed",
    "Bed to the bathroom and back",
    "Up for a few minutes at a time",
    "One small thing, then I'm done",
    "Short bursts with long rests",
    "About half a normal day",
    "Most of a day, slowly",
    "A normal day with one nap",
    "A normal day, no nap",
    "Enough left over for extras",
    "Fully myself again"
  ],
  mood: [
    "Despairing, I can't see past today",
    "Very low, crying often",
    "Flat and tearful",
    "Low, but steady",
    "Wobbly, up and down all day",
    "Neutral, just getting through it",
    "Mostly okay",
    "Steady and hopeful",
    "Good, laughing again",
    "A really good day",
    "Genuinely happy"
  ],
  mobility: [
    "Can't move without help",
    "Rolling over and sitting up with help",
    "Standing with help",
    "A few steps holding on to something",
    "Around the room unaided",
    "Around the house, slowly",
    "Stairs, with a rail",
    "Out to the mailbox and back",
    "A short walk outside",
    "Walking normally without thinking",
    "Moving like I did before surgery"
  ]
};

const S = (key, label, lowIs) => ({ key, label, kind: "scale", lowIs, levels: LEVELS[key] });
// `cond && text` yields false, not "", when the field is empty, so false has to
// be dropped here or an entry with nothing filled in summarises as "false".
const join = (parts) => parts.filter((p) => p !== null && p !== undefined && p !== "" && p !== false).join(" · ");

export const TYPES = {
  checkin: {
    label: "Check-in", icon: ClipboardList, color: "#FF2E88",
    fields: [
      { key: "slot", label: "Slot", kind: "chips", options: ["Waking", "Midday", "Evening", "Bedtime"] },
      S("pain", "Pain", "bad"), S("nausea", "Nausea", "bad"), S("swelling", "Swelling", "bad"),
      S("energy", "Energy", "good"), S("mood", "Mood", "good"), S("mobility", "Mobility", "good"),
      { key: "worst_spot", label: "Worst spot", kind: "text", placeholder: "e.g. left hip" }
    ],
    summary: (d) =>
      join([
        d.slot,
        ...[["pain", "Pain"], ["nausea", "Nausea"], ["swelling", "Swelling"], ["energy", "Energy"], ["mood", "Mood"], ["mobility", "Mobility"]]
          .filter(([k]) => d[k] != null)
          .map(([k, label]) => `${label} ${d[k]}`),
        d.worst_spot && `Worst: ${d.worst_spot}`
      ]),
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
      // 5-minute steps, not 15: the 20-minute flag below has to be reachable.
      { key: "faded_min", label: "Faded in (flag if 20+)", kind: "duration", step: 5 }
    ],
    summary: (d) => join([d.marks, d.color, d.faded_min != null && `faded in ${d.faded_min} min${d.faded_min >= 20 ? " ⚠" : ""}`]),
    marker: () => "SKIN"
  },
  movement: {
    label: "Movement", icon: Activity, color: "#4361EE",
    fields: [
      { key: "kind", label: "Type", kind: "chips", options: ["walk", "resistance", "yoga", "swimming"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "distance", label: "Distance / route", kind: "text", placeholder: "e.g. to mailbox, 2 laps" },
      { key: "help", label: "Help", kind: "chips", options: ["none", "one person", "walker"] },
      { key: "during", label: "During", kind: "chipsMulti", options: ["steady", "dizzy", "breathless", "had to stop"] },
      { key: "calf", label: "Calf", kind: "chips", options: ["no pain", "pain", "swelling", "warm one side"] }
    ],
    summary: (d) => join([d.kind, d.minutes != null && `${d.minutes} min`, d.distance, d.help, (d.during || []).join(", "), d.calf]),
    marker: (d) => `MOVE ${({ walk: "WALK", resistance: "RES", yoga: "YOGA", swimming: "SWIM" }[d.kind] || "WALK")}`
  },
  sleep: {
    label: "Sleep / nap", icon: Moon, color: "#5A189A",
    fields: [
      { key: "kind", label: "Sleep or nap", kind: "chips", options: ["sleep", "nap"] },
      { key: "hours", label: "Hours", kind: "number", steps: [1, 2, 3, 4, 5, 6, 7, 8] },
      { key: "minutes", label: "Plus minutes", kind: "duration" },
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
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "who", label: "Who", kind: "chips", options: ["therapist", "self", "caregiver"] },
      { key: "areas", label: "Areas", kind: "text", placeholder: "e.g. abdomen, left thigh" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "weeping fluid", "more swollen"] }
    ],
    summary: (d) => join([d.minutes != null && `${d.minutes} min`, d.who, d.areas, (d.after || []).join(", ")]),
    marker: () => "MLD"
  },
  tools: {
    label: "Tool work", icon: Brush, color: "#2EC4B6", darkText: true,
    fields: [
      { key: "tool", label: "Tool", kind: "chipsMulti", options: ["dry brush", "gua sha", "cupping", "fascia tool", "roller", "wooden tool", "other"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "areas", label: "Areas", kind: "text", placeholder: "e.g. abdomen, left thigh" },
      { key: "pressure", label: "Pressure", kind: "chips", options: ["light", "medium", "firm"] },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "redness", "bruising", "broken skin", "more swollen"] }
    ],
    summary: (d) => join([(d.tool || []).join(", "), d.minutes != null && `${d.minutes} min`, d.pressure, d.areas, (d.after || []).join(", ")]),
    marker: () => "TOOL"
  },
  bodywork: {
    label: "Other bodywork", icon: HeartHandshake, color: "#E76F51",
    fields: [
      { key: "kind", label: "Kind", kind: "chips", options: ["acupuncture", "somatic therapy", "physical therapy", "chiropractic", "craniosacral", "cupping therapy", "other"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "provider", label: "Who", kind: "text", placeholder: "e.g. Dr. Vega, self" },
      { key: "areas", label: "Areas", kind: "text", placeholder: "e.g. lower back, abdomen" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "drained", "energised", "more swollen"] }
    ],
    summary: (d) => join([d.kind, d.minutes != null && `${d.minutes} min`, d.provider, d.areas, (d.after || []).join(", ")]),
    marker: (d) => `BODY ${({ acupuncture: "ACU", "somatic therapy": "SOM", "physical therapy": "PT", chiropractic: "CHIRO", craniosacral: "CST", "cupping therapy": "CUP" }[d.kind] || "")}`.trim()
  },
  vibration: {
    label: "Vibration plate", icon: Vibrate, color: "#FFBE0B", darkText: true,
    fields: [
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "intensity", label: "Intensity", kind: "chips", options: ["low", "medium", "high"] },
      { key: "position", label: "Position", kind: "chips", options: ["standing", "seated", "feet only", "hands / arms", "lying"] },
      { key: "after", label: "After", kind: "chipsMulti", options: ["looser", "tingly", "sore", "dizzy", "more swollen", "fine"] }
    ],
    summary: (d) => join([d.minutes != null && `${d.minutes} min`, d.intensity, d.position, (d.after || []).join(", ")]),
    marker: (d) => `VIB ${d.minutes != null ? d.minutes + "m" : ""}`.trim()
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

TYPES.walk = { ...TYPES.movement }; // legacy entries logged as "walk"

// Check-in is pinned above the grid, always on, and configured rather than
// toggled, so it is not one of the buttons you can arrange.
export const PINNED = "checkin";

// Retired: the check-in already carries a pain scale. TYPES keeps its
// definition so anything already logged under it still reads back.
// Every note on an entry, the whole-entry one and any written against a single
// measure, in the order the type asks for them.
export const entryNotes = (entry) => {
  const d = entry?.data || {};
  const fields = TYPES[entry?.type]?.fields || [];
  const perMeasure = fields
    .map((f) => ({ label: f.label, text: d[`${f.key}_note`] }))
    .filter((n) => n.text && String(n.text).trim());
  const whole = entry?.note && entry.note.trim() ? [{ label: "Note", text: entry.note }] : [];
  return [...perMeasure, ...whole].map((n) => ({ ...n, text: String(n.text).trim() }));
};

export const QUICK_ORDER = [
  "water", "food", "med", "temp", "sleep", "movement",
  "bm", "urine", "pads", "incisions", "garment", "skin", "mld", "tools", "bodywork",
  "vibration", "photo", "measure", "weight"
];

// Everything the check-in could ask, in the order it asks it. A surgery picks
// a subset; this is the ceiling.
export const CHECKIN_MEASURES = [
  { key: "pain", label: "Pain" },
  { key: "nausea", label: "Nausea" },
  { key: "swelling", label: "Swelling" },
  { key: "energy", label: "Energy" },
  { key: "mood", label: "Mood" },
  { key: "mobility", label: "Mobility" },
  { key: "worst_spot", label: "Worst spot" }
];

export const DEFAULT_CHECKIN_SLOTS = [
  { label: "Waking", time: "07:00" },
  { label: "Midday", time: "12:00" },
  { label: "Evening", time: "18:00" },
  { label: "Bedtime", time: "22:00" }
];

const namedSlots = (slots) => (slots || []).filter((s) => s && s.label && String(s.label).trim());

export const checkinSlots = (surgery) => {
  const saved = namedSlots(surgery?.checkin_slots);
  return saved.length ? saved : DEFAULT_CHECKIN_SLOTS;
};

// The check-in this surgery actually asks for. TYPES.checkin is the maximum;
// a surgery can ask fewer times and record fewer things, never more.
export const checkinConfig = (surgery) => {
  const slots = checkinSlots(surgery);
  const wanted = surgery?.checkin_measures?.length
    ? CHECKIN_MEASURES.filter((m) => surgery.checkin_measures.includes(m.key))
    : CHECKIN_MEASURES;
  const byKey = Object.fromEntries(TYPES.checkin.fields.map((f) => [f.key, f]));
  return {
    ...TYPES.checkin,
    fields: [
      { key: "slot", label: "Slot", kind: "chips", options: slots.map((s) => s.label) },
      ...wanted.map((m) => byKey[m.key]).filter(Boolean)
    ]
  };
};

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

// The slot whose time has most recently passed, so the chip is already right
// at the moment she opens the form. Before the first one, the first.
export const defaultSlot = (slots) => {
  const list = namedSlots(slots).length ? namedSlots(slots) : DEFAULT_CHECKIN_SLOTS;
  const d = new Date();
  const now = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const due = list.filter((s) => (s.time || "00:00") <= now);
  return (due.length ? due[due.length - 1] : list[0]).label;
};