import {
  ClipboardList, Droplets, Utensils, Apple, Pill, Thermometer, Droplet, Bath,
  Layers, Stethoscope, Shirt, Hand, Activity, Moon, Waves, Camera, Ruler, Scale,
  Brush, HeartHandshake, Vibrate, Wind
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

// The parts a body map offers, front and back on the same list: a finding is
// recorded against a named part, not against a pair of coordinates, so it can
// be counted and compared across days.

export const SKIN_SYMPTOMS = ["Bruising", "Edema", "Numbness", "Flaking", "Pale or cold", "Rash / hives"];

// Urine is judged by eye against a chart, so the chart is the control: a swatch
// per colour with its name, rather than a word you have to picture.
export const URINE_COLORS = [
  ["Pale yellow", "#F5EFA8"], ["Dark yellow / amber", "#E8B33A"], ["Orange", "#E8792B"],
  ["Pink / red", "#E0555F"], ["Brown / tea", "#8C5A2B"], ["Green / blue", "#3FB8A0"]
];

// Worst last. An incision marked Minor or above is asked what is wrong with it;
// a normal one is not, because there is nothing to say.
export const INCISION_LEVELS = [
  ["Normal", "#06D6A0"], ["Minor", "#FFC93C"], ["Risk", "#F77F00"], ["Issue", "#E01E37"]
];
export const INCISION_SYMPTOMS = [
  "Increased pain", "Redness", "Increased warmth", "Swelling", "Pus", "Odor", "Delayed healing"
];

// The tape-measure sheet, in the order it is worked down the body. The paired
// ones are measured on both sides; the rest are a single number.
export const MEASUREMENTS = [
  { name: "Bicep", pair: true }, { name: "Elbow", pair: true }, { name: "Wrist", pair: true },
  { name: "Thigh", pair: true }, { name: "Knee", pair: true }, { name: "Calf", pair: true },
  { name: "Ankle", pair: true },
  { name: "Bust" }, { name: "Under bust" }, { name: "Waist" }, { name: "Hips" },
  { name: "Waist to hips" }, { name: "Hips to thigh" }, { name: "Thigh to knee" },
  { name: "Knee to calf" }, { name: "Calf to ankle" }
];

// The Bristol stool scale, drawn rather than described in the popup; the words
// are what the entry reads back as.
export const BRISTOL = [
  "Hard lumps", "Lumpy sausage", "Cracked sausage", "Smooth and soft",
  "Soft blobs", "Mushy", "Watery"
];

// 1 painfully hungry to 5 painfully full, with 3 as the sweet spot. The colour
// is given per level rather than derived: this scale is bad at both ends, so no
// single ramp reads correctly across it.
export const HUNGER_COLORS = ["#E01E37", "#F07300", "#2EC44B", "#F0A500", "#E8720C"];
export const HUNGER_LEVELS = [
  "Painfully hungry",
  "Hungry",
  "Comfortable",
  "Full",
  "Painfully full"
];

// What a nutrient entry can record. The nutrient is the entry's first question,
// so one tracker covers all of them instead of one tracker each.
export const NUTRIENTS = [
  { name: "Protein", unit: "g" },
  { name: "Carbs", unit: "g" },
  { name: "Fat", unit: "g" },
  { name: "Fiber", unit: "g" },
  { name: "Sugar", unit: "g" },
  { name: "Sodium", unit: "mg" }
];

export const nutrientUnit = (name) => NUTRIENTS.find((n) => n.name === name)?.unit || "g";

const S = (key, label, highIs) => ({ key, label, kind: "scale", highIs, levels: LEVELS[key] });
// `cond && text` yields false, not "", when the field is empty, so false has to
// be dropped here or an entry with nothing filled in summarises as "false".
const join = (parts) => parts.filter((p) => p !== null && p !== undefined && p !== "" && p !== false).join(" · ");

// Red up through amber to green. Counting the hue down instead runs the long
// way round the wheel, so a middling value comes out blue rather than amber.
export const gradeColor = (v, max, highIs) =>
  `hsl(${((highIs === "bad" ? max - v : v) / max) * 130} 85% 58%)`;

const areasOf = (d) => (Array.isArray(d.areas) ? d.areas : []);
const nutrientsOf = (d) => Object.entries(d.nutrients || {}).filter(([, v]) => v !== "" && v != null);
// The medicines on a Med entry: what was actually taken, and what was brought
// up by the group and then tapped off.
const takenOf = (d) => (Array.isArray(d.taken) ? d.taken : []).filter((m) => !m.skipped);
const skippedOf = (d) => (Array.isArray(d.taken) ? d.taken : []).filter((m) => m.skipped);
// Every number actually written on the tape-measure sheet, left and right
// counted separately, so "16 marks" means sixteen readings.
const measuredOf = (d) =>
  Object.entries(d.values || {}).flatMap(([name, v]) =>
    typeof v === "object" && v !== null
      ? [["l", "r"].map((s) => (v[s] ? [`${name} ${s === "l" ? "left" : "right"}`, v[s]] : null))].flat().filter(Boolean)
      : v
        ? [[name, v]]
        : []);
const findingsOf = (d) =>
  Object.entries(d.findings || {}).flatMap(([area, syms]) => (syms || []).map((s) => [area, s]));

// One pill on the day card. `fill` turns it into a bar: the text stays this
// entry's own number and the bar runs to the day's total against the goal.
const pill = (text, extra = {}) => ({ text, ...extra });

export const TYPES = {
  checkin: {
    label: "Check-in", icon: ClipboardList, color: "#FF2E88",
    fields: [
      { key: "slot", label: "Slot", kind: "chips", options: ["Waking", "Midday", "Evening", "Bedtime"] },
      S("pain", "Pain", "bad"), S("nausea", "Nausea", "bad"), S("swelling", "Swelling", "bad"),
      S("energy", "Energy", "good"), S("mood", "Mood", "good"), S("mobility", "Mobility", "good")
    ],
    summary: (d) =>
      join([
        d.slot,
        ...[["pain", "Pain"], ["nausea", "Nausea"], ["swelling", "Swelling"], ["energy", "Energy"], ["mood", "Mood"], ["mobility", "Mobility"]]
          .filter(([k]) => d[k] != null)
          .map(([k, label]) => `${label} ${d[k]}`)
      ]),
    pills: (d) => [pill(d.slot || "Check-in")]
  },
  water: {
    label: "Water", icon: Droplets, color: "#00B4D8", goal: { key: "water", label: "Water", unit: "oz", suggest: 64 },
    fields: [
      { key: "ounces", label: "Ounces", kind: "number", steps: [4, 8, 12, 16, 20, 24, 32] },
      { key: "type", label: "Type", kind: "chips", options: ["water", "electrolyte", "broth", "other"] }
    ],
    summary: (d) => join([`${d.ounces ?? "?"} oz`, d.type || "water"]),
    pills: (d, e, run, goal) => [pill(`${d.ounces ?? 0} oz`, { fill: { done: run?.water ?? d.ounces ?? 0, goal } })]
  },
  meals: {
    label: "Meals", icon: Utensils, color: "#FF9E00", darkText: true,
    fields: [
      { key: "meal", label: "Meal", kind: "chips", options: ["Breakfast", "Snack", "Lunch", "Afternoon snack", "Dinner"] },
      { key: "description", label: "What you ate", kind: "text", placeholder: "e.g. half a chicken sandwich" },
      { key: "hunger", label: "Hunger", kind: "hunger" },
      { key: "went_down", label: "Went down", kind: "chips", options: ["fine", "slow", "hurt", "couldn't finish"] }
    ],
    summary: (d) =>
      join([
        d.meal, d.description,
        d.hunger?.before != null && `before ${HUNGER_LEVELS[d.hunger.before - 1]}`,
        d.hunger?.after != null && `after ${HUNGER_LEVELS[d.hunger.after - 1]}`,
        d.went_down && `went down: ${d.went_down}`
      ]),
    pills: (d) => [
      pill(d.meal || "Meal"),
      d.went_down && d.went_down !== "fine" ? pill(d.went_down, { tone: d.went_down === "couldn't finish" ? "bad" : "warn" }) : null
    ].filter(Boolean)
  },
  nutrients: {
    label: "Nutrients", icon: Apple, color: "#E85D04", stacked: true,
    goal: { key: "nutrients", label: "Nutrients", perNutrient: true },
    fields: [{ key: "nutrients", label: "Nutrients", kind: "nutrients" }],
    summary: (d) => join(nutrientsOf(d).map(([n, v]) => `${n} ${v} ${nutrientUnit(n)}`)),
    pills: (d, e, run, goals) =>
      nutrientsOf(d).map(([n, v]) =>
        pill(`${n} ${v} ${nutrientUnit(n)}`, { fill: { done: run?.nutrients?.[n] ?? +v, goal: goals?.[n] } }))
  },
  med: {
    label: "Med", icon: Pill, color: "#9B5DE5",
    fields: [
      { key: "group", label: "Group", kind: "medGroup" },
      { key: "taken", label: "Medicines", kind: "medList" },
      { key: "next_allowed", label: "Next dose", kind: "time" }
    ],
    summary: (d) =>
      join([
        d.group,
        ...takenOf(d).map((m) => join([m.name, m.dose])),
        skippedOf(d).length && `skipped: ${skippedOf(d).map((m) => m.name).join(", ")}`,
        d.next_allowed && `next: ${d.next_allowed}`
      ]),
    pills: (d) => {
      const skipped = skippedOf(d).length;
      return [
        pill(d.group || takenOf(d)[0]?.name || "Med"),
        skipped ? pill(`${skipped} skipped`, { tone: "warn" }) : null
      ].filter(Boolean);
    }
  },
  temp: {
    label: "Temp", icon: Thermometer, color: "#FF006E",
    fields: [
      { key: "temp", label: "Temperature (°F)", kind: "number", decimal: true, placeholder: "98.6" },
      { key: "symptoms", label: "Symptoms", kind: "chipsMulti", options: ["chills", "sweats", "flushed", "shivering"] }
    ],
    summary: (d) => join([`${d.temp ?? "?"}°F`, (d.symptoms || []).join(", ")]),
    pills: (d) => [pill(`${d.temp ?? "?"}°F`)]
  },
  rest: {
    label: "Rest", icon: Moon, color: "#5A189A",
    fields: [
      { key: "state", label: "Kind", kind: "chips", options: ["Dozing", "Napping", "Sleeping"] },
      { key: "minutes", label: "How long", kind: "duration", step: 60 },
      { key: "position", label: "Position", kind: "chips", options: ["recliner", "wedge", "propped", "flat", "side"] },
      { key: "quality", label: "Quality", kind: "scale5", highIs: "good", ends: ["worst", "best"] },
      { key: "woke_for", label: "Woke for", kind: "chipsMulti", options: ["pain", "bathroom", "nausea", "garment", "alarm"] }
    ],
    summary: (d) =>
      join([
        d.state, d.minutes != null && d.minutes !== "" && `${d.minutes} min`, d.position,
        d.quality != null && `quality ${d.quality}`, (d.woke_for || []).join(", ")
      ]),
    pills: (d) => [
      pill(d.state || "Rest"),
      d.quality != null ? pill(`Quality ${d.quality}`, { tone: "grade", grade: d.quality, highIs: "good" }) : null
    ].filter(Boolean)
  },
  movement: {
    label: "Movement", icon: Activity, color: "#4361EE",
    fields: [
      { key: "kind", label: "Kind", kind: "chips", options: ["Walk", "Run", "Swim", "Dance", "Yoga", "Weights", "Pilates", "Boxing", "Other"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "miles", label: "Distance", kind: "number", decimal: true, unit: "miles", placeholder: "0.5" },
      { key: "help", label: "Help", kind: "chips", options: ["none", "one person", "walker"] },
      { key: "felt", label: "How it felt", kind: "chipsMulti", options: ["steady", "dizzy", "breathless", "tired", "good"] },
      { key: "pain", label: "Pain", kind: "scale5", highIs: "bad", ends: ["none", "worst"] }
    ],
    summary: (d) =>
      join([
        d.kind, d.minutes != null && d.minutes !== "" && `${d.minutes} min`,
        d.miles != null && d.miles !== "" && `${d.miles} mi`,
        d.help, (d.felt || []).join(", "), d.pain != null && `pain ${d.pain}`
      ]),
    pills: (d) => [
      pill(d.kind || "Movement"),
      d.pain != null ? pill(`Pain ${d.pain}`, { tone: "grade", grade: d.pain, highIs: "bad" }) : null
    ].filter(Boolean)
  },
  bm: {
    label: "BM", icon: Bath, color: "#6D4C2F",
    fields: [{ key: "bristol", label: "Bristol type", kind: "bristol" }],
    summary: (d) => (d.bristol ? `Bristol ${d.bristol} · ${BRISTOL[d.bristol - 1]}` : "BM"),
    pills: (d) => [pill(d.bristol ? `Bristol ${d.bristol}` : "BM")]
  },
  urine: {
    label: "Urine", icon: Droplet, color: "#E8B33A", darkText: true,
    fields: [
      { key: "color", label: "Colour", kind: "swatch", options: URINE_COLORS },
      { key: "clarity", label: "Clarity", kind: "chips", options: ["Clear", "Slightly cloudy", "Cloudy", "Foamy", "Sediment"] },
      { key: "symptoms", label: "Symptoms", kind: "chipsMulti", options: ["burning", "urgency", "hesitancy"] }
    ],
    summary: (d) => join([d.color, d.clarity, (d.symptoms || []).join(", ")]),
    pills: (d) => [
      pill(d.color || "Urine"),
      (d.symptoms || []).length ? pill(d.symptoms[0], { tone: "warn" }) : null
    ].filter(Boolean)
  },
  drainage: {
    label: "Drainage", icon: Layers, color: "#F15BB5",
    fields: [
      { key: "count", label: "Pads changed", kind: "number", steps: [1, 2, 3, 4] },
      { key: "amount", label: "Amount", kind: "chips", options: ["spotting", "light", "half soaked", "soaked"] },
      { key: "color", label: "Colour", kind: "chips", options: ["Bright Red", "Maroon", "Pink or Pink Tinged", "Clear or Yellow translucent"] },
      { key: "odor", label: "Odor", kind: "chips", options: ["none", "foul"] }
    ],
    summary: (d) => join([d.count != null && d.count !== "" && `×${d.count}`, d.amount, d.color, d.odor && `odor: ${d.odor}`]),
    pills: (d) => [
      pill(d.color || "Drainage"),
      d.odor === "foul" ? pill("Foul", { tone: "bad" }) : null
    ].filter(Boolean)
  },
  incisions: {
    label: "Incisions", icon: Stethoscope, color: "#FB5607",
    fields: [
      { key: "areas", label: "Where", kind: "bodymap" },
      { key: "status", label: "How each one looks", kind: "incisions" }
    ],
    summary: (d) =>
      join(
        areasOf(d).map((a) =>
          join([`${a}: ${d.status?.[a]?.level || "Normal"}`, (d.status?.[a]?.symptoms || []).join(", ")]))
      ),
    pills: (d) => {
      const areas = areasOf(d);
      const flagged = areas.filter((a) => ["Risk", "Issue"].includes(d.status?.[a]?.level));
      return [
        pill(areas.length ? `${areas.length - flagged.length} of ${areas.length}` : "Incisions"),
        flagged.length
          ? pill(flagged.length === 1 ? d.status[flagged[0]].level : `${flagged.length} flagged`, { tone: "bad" })
          : null
      ].filter(Boolean);
    }
  },
  compression: {
    label: "Compression", icon: Shirt, color: "#06D6A0",
    fields: [
      { key: "garment", label: "Garment", kind: "garment" },
      { key: "action", label: "Action", kind: "chips", options: ["on", "off", "adjusted"] },
      { key: "fit", label: "Fit", kind: "chips", options: ["tight", "right", "loose"] },
      { key: "problems", label: "Problems", kind: "chipsMulti", options: ["rolling", "bunching", "digging", "seam pressure"] },
      { key: "foam", label: "Foam", kind: "chips", options: ["fine", "shifted", "removed"] }
    ],
    summary: (d) => join([d.garment, d.action, d.fit, (d.problems || []).join(", "), d.foam && `foam: ${d.foam}`]),
    pills: (d) => [
      pill(d.garment || d.action || "Compression"),
      (d.problems || []).length ? pill(d.problems[0], { tone: "warn" }) : null
    ].filter(Boolean)
  },
  skin: {
    label: "Skin Changes", icon: Hand, color: "#FF7BAC", stacked: true,
    fields: [
      { key: "areas", label: "Where", kind: "bodymap" },
      { key: "findings", label: "What you see", kind: "areaSymptoms", options: SKIN_SYMPTOMS }
    ],
    summary: (d) => join(findingsOf(d).map(([a, s]) => `${a}: ${s.toLowerCase()}`)),
    pills: (d) => findingsOf(d).map(([a, s]) => pill(`${a} · ${s}`))
  },
  mld: {
    label: "MLD / massage", icon: Waves, color: "#B5179E", group: "bodywork", abbr: "MLD",
    fields: [
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "who", label: "Who", kind: "chips", options: ["therapist", "self", "partner"] },
      { key: "areas", label: "Areas", kind: "bodymap" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "tired"] }
    ],
    summary: (d) => join([d.minutes != null && d.minutes !== "" && `${d.minutes} min`, d.who, areasOf(d).join(", "), (d.after || []).join(", ")]),
    pills: (d) => [pill(`MLD ${d.minutes || 0}m`)]
  },
  tools: {
    label: "Tool work", icon: Brush, color: "#2EC4B6", darkText: true, group: "bodywork", abbr: "TOOL",
    fields: [
      { key: "tool", label: "Tools", kind: "chipsMulti", options: ["dry brush", "gua sha", "cup", "roller", "ball"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "pressure", label: "Pressure", kind: "chips", options: ["light", "medium", "firm"] },
      { key: "areas", label: "Areas", kind: "bodymap" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "tired"] }
    ],
    summary: (d) => join([(d.tool || []).join(", "), d.minutes != null && d.minutes !== "" && `${d.minutes} min`, d.pressure, areasOf(d).join(", "), (d.after || []).join(", ")]),
    pills: (d) => [pill(`TOOL ${d.minutes || 0}m`)]
  },
  bodywork: {
    label: "Other bodywork", icon: HeartHandshake, color: "#E76F51", group: "bodywork", abbr: "ACU",
    fields: [
      { key: "kind", label: "Kind", kind: "chips", options: ["acupuncture", "somatic", "physical therapy", "chiropractic", "other"] },
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "provider", label: "Who", kind: "text", placeholder: "e.g. Dr. Vega, self" },
      { key: "areas", label: "Areas", kind: "bodymap" },
      { key: "after", label: "After", kind: "chipsMulti", options: ["softer", "looser", "sore", "tired"] }
    ],
    summary: (d) => join([d.kind, d.minutes != null && d.minutes !== "" && `${d.minutes} min`, d.provider, areasOf(d).join(", "), (d.after || []).join(", ")]),
    pills: (d) => [pill(`ACU ${d.minutes || 0}m`)]
  },
  pump: {
    label: "Compression Pump", icon: Wind, color: "#457B9D", group: "bodywork", abbr: "PUMP",
    fields: [
      { key: "minutes", label: "Treatment time", kind: "duration", step: 15 },
      { key: "areas", label: "Areas", kind: "bodymap" }
    ],
    summary: (d) => join([d.minutes != null && d.minutes !== "" && `${d.minutes} min`, areasOf(d).join(", ")]),
    pills: (d) => [pill(`PUMP ${d.minutes || 0}m`)]
  },
  vibration: {
    label: "Vibration plate", icon: Vibrate, color: "#FFBE0B", darkText: true,
    fields: [
      { key: "minutes", label: "How long", kind: "duration" },
      { key: "intensity", label: "Setting", kind: "chips", options: ["low", "medium", "high"] },
      { key: "position", label: "Position", kind: "chips", options: ["standing", "seated", "hands"] },
      { key: "after", label: "After", kind: "chipsMulti", options: ["looser", "tingly", "sore", "tired"] }
    ],
    summary: (d) => join([d.minutes != null && d.minutes !== "" && `${d.minutes} min`, d.intensity, d.position, (d.after || []).join(", ")]),
    pills: (d) => [pill(`${d.minutes || 0}m`)]
  },
  photo: {
    label: "Photo", icon: Camera, color: "#3A86FF",
    fields: [
      { key: "photo_url", label: "Photo", kind: "file" },
      { key: "caption", label: "Caption", kind: "text", placeholder: "e.g. incision day 3" }
    ],
    summary: (d) => join([d.caption, d.photo_url ? "photo attached" : null]),
    pills: () => [pill("Photo")]
  },
  measure: {
    label: "Measurements", icon: Ruler, color: "#80FFDB", darkText: true,
    fields: [
      { key: "values", label: "Measurements", kind: "measurements" },
      { key: "cup", label: "Cup size", kind: "text", placeholder: "e.g. D (sometimes DD)" }
    ],
    summary: (d) => join([...measuredOf(d).map(([n, v]) => `${n} ${v}`), d.cup && `cup ${d.cup}`]),
    pills: (d) => [pill(`${measuredOf(d).length} marks`)]
  },
  weight: {
    label: "Weight", icon: Scale, color: "#E0AAFF", darkText: true,
    fields: [{ key: "weight", label: "Weight", kind: "number", decimal: true, unit: "lbs", placeholder: "142" }],
    summary: (d) => `${d.weight ?? "?"} lbs`,
    pills: (d) => [pill(`${d.weight ?? "?"} lbs`)]
  }
};

// Check-in is pinned above the grid, always on, and configured rather than
// toggled, so it is not one of the buttons you can arrange.
export const PINNED = "checkin";

// The four trackers that ask where on the body, folded into one Body Work row
// on the day page. The vibration plate is not one of them: nothing on the plate
// is done to a named part, so it keeps its own row.
export const BODYWORK_GROUP = Object.keys(TYPES).filter((t) => TYPES[t].group === "bodywork");

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
  "water", "meals", "nutrients", "med", "temp", "rest", "movement",
  "bm", "urine", "drainage", "incisions", "compression", "skin",
  "mld", "tools", "bodywork", "pump", "vibration", "photo", "measure", "weight"
];

// The trackers that can be given a target in settings, in the order they are
// offered there.
export const GOAL_TYPES = ["water", "nutrients", "bodywork"];

export const BODYWORK_GOAL = { key: "bodywork", label: "Body Work", unit: "min", suggest: 120 };

export const goalFor = (surgery, key) => {
  const v = surgery?.goals?.[key];
  return typeof v === "number" && v > 0 ? v : null;
};

export const nutrientGoals = (surgery) => surgery?.goals?.nutrients || {};

// Everything the check-in could ask, in the order it asks it. A surgery picks
// a subset; this is the ceiling.
export const CHECKIN_MEASURES = [
  { key: "pain", label: "Pain" },
  { key: "nausea", label: "Nausea" },
  { key: "swelling", label: "Swelling" },
  { key: "energy", label: "Energy" },
  { key: "mood", label: "Mood" },
  { key: "mobility", label: "Mobility" }
];

export const DEFAULT_CHECKIN_SLOTS = [
  { label: "Waking", time: "07:00" },
  { label: "Midday", time: "12:00" },
  { label: "Evening", time: "18:00" },
  { label: "Bedtime", time: "22:00" }
];

// Which spots this patient measures, in the order she chose. A name from the
// built-in list keeps its left-and-right pair; one she typed herself is a single
// figure, because nothing else knows it has two sides. Empty means the built-in
// set: a list nobody has narrowed is not a list of nothing.
export const measurementSpots = (patient) => {
  const saved = (Array.isArray(patient?.measurements) ? patient.measurements : []).filter(Boolean);
  if (!saved.length) return MEASUREMENTS;
  const known = Object.fromEntries(MEASUREMENTS.map((m) => [m.name, m]));
  return saved.map((name) => known[name] || { name });
};

const namedSlots = (slots) => (slots || []).filter((s) => s && s.label && String(s.label).trim());

export const checkinSlots = (patient) => {
  const saved = namedSlots(patient?.checkin_slots);
  return saved.length ? saved : DEFAULT_CHECKIN_SLOTS;
};

// The check-in belongs to the patient, not to a surgery. How often you are
// asked how you feel, and what you are asked, does not change because a second
// operation was added. TYPES.checkin is the maximum; a patient can ask fewer
// times and record fewer things, never more.
export const checkinConfig = (patient) => {
  const slots = checkinSlots(patient);
  const wanted = patient?.checkin_measures?.length
    ? CHECKIN_MEASURES.filter((m) => patient.checkin_measures.includes(m.key))
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
