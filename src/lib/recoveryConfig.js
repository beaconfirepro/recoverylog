// Drives entry forms, list rendering, and markers for every entry type.

export const ENTRY_TYPES = [
  {
    key: 'checkin', label: 'Check-In', abbr: 'CHK',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    marker: (_d, h) => `CHK ${h.timeStr}`,
    fields: [
      { key: 'pain', label: 'Pain', type: 'slider', max: 10, worst: true },
      { key: 'nausea', label: 'Nausea', type: 'slider', max: 10, worst: true },
      { key: 'swelling', label: 'Swelling', type: 'slider', max: 10, worst: true },
      { key: 'energy', label: 'Energy', type: 'slider', max: 10, best: true },
      { key: 'mood', label: 'Mood', type: 'slider', max: 10, best: true },
      { key: 'mobility', label: 'Mobility', type: 'slider', max: 10, best: true },
      { key: 'worst_spot', label: 'Worst spot', type: 'text' },
    ],
  },
  {
    key: 'urine', label: 'Urine', abbr: 'URN',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    marker: (d) => `URN`,
    fields: [
      { key: 'size', label: 'Size', type: 'chips', options: ['S', 'M', 'L'] },
      { key: 'color', label: 'Color', type: 'chips', options: ['clear', 'pale', 'yellow', 'dark yellow', 'amber', 'tea', 'pink', 'red'] },
      { key: 'other', label: 'Other', type: 'chips', multiple: true, options: ['burning', 'urgency', 'hard to start'] },
    ],
  },
  {
    key: 'bm', label: 'BM', abbr: 'BM',
    color: 'bg-stone-200 text-stone-700 border-stone-300',
    marker: () => `BM`,
    fields: [
      { key: 'consistency', label: 'Consistency', type: 'chips', options: ['soft', 'formed', 'hard', 'loose', 'watery'] },
      { key: 'ease', label: 'Ease', type: 'chips', options: ['easy', 'straining', 'painful'] },
      { key: 'blood', label: 'Blood', type: 'chips', options: ['none', 'streaks', 'dark'] },
    ],
  },
  {
    key: 'water', label: 'Water', abbr: 'OZ',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    marker: (_d, h) => `OZ ${h.waterTotal}`,
    fields: [
      { key: 'ounces', label: 'Ounces', type: 'number' },
      { key: 'type', label: 'Type', type: 'chips', options: ['water', 'electrolyte', 'broth', 'other'] },
    ],
  },
  {
    key: 'food', label: 'Food', abbr: 'FOOD',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    marker: (d) => `FOOD`,
    fields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'protein', label: 'Protein (g)', type: 'number' },
      { key: 'appetite', label: 'Appetite', type: 'chips', options: ['none', 'low', 'normal', 'famished'] },
      { key: 'how_down', label: 'How it went down', type: 'chips', options: ['fine', 'slow', 'nausea', 'vomited'] },
    ],
  },
  {
    key: 'med', label: 'Med', abbr: 'MED',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    marker: (_d, h) => `MED ${h.timeStr}`,
    fields: [
      { key: 'drug', label: 'Drug', type: 'text' },
      { key: 'dose', label: 'Dose', type: 'text' },
      { key: 'reason', label: 'Reason', type: 'text' },
      { key: 'next_allowed', label: 'Next allowed', type: 'datetime' },
    ],
  },
  {
    key: 'pain_recheck', label: 'Pain Recheck', abbr: 'PAIN',
    color: 'bg-red-100 text-red-700 border-red-200',
    marker: (d) => `PAIN ${d.pain ?? ''}`,
    fields: [
      { key: 'pain', label: 'Pain', type: 'slider', max: 10, worst: true },
      { key: 'quality', label: 'Quality', type: 'chips', multiple: true, options: ['aching', 'burning', 'stabbing', 'throbbing', 'tight', 'pulling', 'zinging', 'numb'] },
      { key: 'worse_with', label: 'Worse with', type: 'chips', multiple: true, options: ['standing', 'walking', 'coughing', 'twisting', 'garment'] },
    ],
  },
  {
    key: 'temp', label: 'Temp', abbr: 'TEMP',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    marker: (d) => `TEMP ${d.temp ?? ''}`,
    fields: [
      { key: 'temp', label: 'Temperature', type: 'number' },
      { key: 'flags', label: 'Flags', type: 'chips', multiple: true, options: ['chills', 'sweats', 'flushed', 'shivering'] },
    ],
  },
  {
    key: 'garment', label: 'Garment / Foam', abbr: 'GAR',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    marker: (d) => `GAR ${d.state ?? ''}`,
    fields: [
      { key: 'state', label: 'State', type: 'chips', options: ['on', 'off', 'adjust'] },
      { key: 'fit', label: 'Fit', type: 'chips', options: ['loose', 'right', 'tight', 'cutting in'] },
      { key: 'behaviour', label: 'Behaviour', type: 'chips', multiple: true, options: ['rolling', 'bunching', 'sliding', 'seam pressure'] },
      { key: 'feel', label: 'Feel underneath', type: 'chips', multiple: true, options: ['fine', 'numb', 'tingling', 'burning', 'pins and needles'] },
    ],
  },
  {
    key: 'skin', label: 'Skin Under Garment', abbr: 'SKIN',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    marker: () => `SKIN`,
    fields: [
      { key: 'marks', label: 'Marks', type: 'chips', options: ['none', 'lines', 'indents', 'blister', 'broken skin'] },
      { key: 'color', label: 'Color', type: 'chips', options: ['normal', 'pink', 'red', 'purple', 'white', 'mottled'] },
      { key: 'faded_minutes', label: 'Faded in (min)', type: 'number' },
    ],
  },
  {
    key: 'pads', label: 'Pads / Drainage', abbr: 'PADS',
    color: 'bg-red-100 text-red-700 border-red-200',
    marker: (d) => `PADS x${d.count ?? ''} ${d.color ?? ''}`.trim(),
    fields: [
      { key: 'count', label: 'Count changed', type: 'number' },
      { key: 'amount', label: 'Amount', type: 'chips', options: ['spotting', 'light', 'half soaked', 'soaked', 'through to clothes'] },
      { key: 'color', label: 'Color', type: 'chips', options: ['bright red', 'dark red', 'pink', 'watery pink', 'straw', 'clear', 'yellow', 'green'] },
      { key: 'odor', label: 'Odor', type: 'chips', options: ['none', 'foul'] },
    ],
  },
  {
    key: 'incisions', label: 'Incisions', abbr: 'INC',
    color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    marker: () => `INC`,
    fields: [
      { key: 'state', label: 'State', type: 'chips', options: ['closed', 'open', 'gaping', 'weeping'] },
      { key: 'edges', label: 'Edges', type: 'chips', options: ['together', 'separating'] },
      { key: 'skin', label: 'Skin', type: 'chips', options: ['normal', 'pink', 'red', 'hot', 'hard', 'spreading'] },
      { key: 'odor', label: 'Odor', type: 'chips', options: ['none', 'foul'] },
    ],
  },
  {
    key: 'walk', label: 'Walk', abbr: 'WALK',
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    marker: (d) => `WALK ${d.minutes ?? ''}m`,
    fields: [
      { key: 'minutes', label: 'Minutes', type: 'number' },
      { key: 'distance', label: 'Distance', type: 'text' },
      { key: 'help', label: 'Help', type: 'chips', options: ['none', 'one person', 'walker'] },
      { key: 'during', label: 'During', type: 'chips', multiple: true, options: ['steady', 'dizzy', 'breathless', 'had to stop'] },
      { key: 'calf', label: 'Calf', type: 'chips', options: ['no pain', 'pain', 'swelling', 'warm one side'] },
    ],
  },
  {
    key: 'sleep', label: 'Sleep / Nap', abbr: 'SLP',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    marker: (d) => `SLP ${d.hours ?? ''}h`,
    fields: [
      { key: 'hours', label: 'Hours', type: 'number' },
      { key: 'minutes', label: 'Minutes', type: 'number' },
      { key: 'position', label: 'Position', type: 'chips', options: ['recliner', 'wedge', 'propped', 'flat', 'side'] },
      { key: 'quality', label: 'Quality', type: 'chips', options: ['solid', 'broken', 'restless', 'none'] },
      { key: 'woke_for', label: 'Woke for', type: 'chips', multiple: true, options: ['pain', 'bathroom', 'nausea', 'garment', 'alarm'] },
    ],
  },
  {
    key: 'mld', label: 'MLD / Massage', abbr: 'MLD',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    marker: (d) => `MLD ${d.minutes ?? ''}m`,
    fields: [
      { key: 'minutes', label: 'Minutes', type: 'number' },
      { key: 'who', label: 'Who', type: 'chips', options: ['therapist', 'self', 'caregiver'] },
      { key: 'areas', label: 'Areas', type: 'text' },
      { key: 'after', label: 'After', type: 'chips', multiple: true, options: ['softer', 'looser', 'sore', 'weeping fluid', 'more swollen'] },
    ],
  },
  {
    key: 'photos', label: 'Photos', abbr: 'PHOTO',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    marker: () => `PHOTO`,
    fields: [
      { key: 'note', label: 'What / where', type: 'text' },
    ],
  },
  {
    key: 'measurements', label: 'Measurements', abbr: 'MEAS',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    marker: () => `MEAS`,
    fields: [],
    special: 'measurements',
  },
  {
    key: 'weight', label: 'Weight', abbr: 'WT',
    color: 'bg-slate-200 text-slate-700 border-slate-300',
    marker: (d) => `WT ${d.weight ?? ''}`,
    fields: [
      { key: 'weight', label: 'Weight', type: 'number' },
    ],
  },
];

export const ENTRY_TYPE_MAP = Object.fromEntries(ENTRY_TYPES.map((t) => [t.key, t]));

export const RED_FLAG_ITEMS = [
  { key: 'fever', label: "Fever over surgeon's number" },
  { key: 'calf', label: 'Calf pain, swelling, or warmth one side' },
  { key: 'chest', label: 'Chest pain or short of breath' },
  { key: 'redness', label: 'Redness spreading, skin hot or hard' },
  { key: 'drainage', label: 'Drainage foul or pus-like' },
  { key: 'bleeding', label: 'Bright red bleeding restarted after slowing' },
  { key: 'dizzy', label: 'Dizzy on standing' },
  { key: 'urine', label: 'Urine dropped off or dark all day' },
  { key: 'pain_worse', label: 'Pain suddenly worse, not better' },
  { key: 'no_bm', label: 'No BM for 3+ days' },
  { key: 'numbness', label: 'Numbness or color change under garment' },
  { key: 'confused', label: 'Confused or hard to wake' },
];

export const SLEPT_POSITIONS = ['recliner', 'wedge', 'propped', 'flat', 'side'];