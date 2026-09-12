// The getting-started checklist shown to a patient who has not set up a
// surgery yet. State lives in localStorage next to the active-surgery pick:
// onboarding is a per-device aid, not medical data, so it does not need a
// round trip to the backend.
const key = (patientId) => `recoverylog.orientation.${patientId || "anon"}`;

export const DEFAULT_ORIENTATION = {
  dismissed: false,
  minimized: false,
  choice: null, // "surgery" | "maintenance"
  track_before: true,
  track_after: true,
  items: {} // { [itemKey]: boolean }
};

export const ORIENTATION_ITEMS = [
  {
    key: "surgery",
    n: 1,
    question: "Are you tracking for an upcoming surgery or for ongoing maintenance?",
    body: "If a surgery is coming up, add it and your days count from its date. For maintenance, log by date with no surgery day.",
    kind: "surgery"
  },
  {
    key: "checkins",
    n: 2,
    question: "Set up your check-ins.",
    body: "The check-in rates pain, swelling, mobility, mood, nausea and energy on one swipe screen. It works best at the same times each day.",
    kind: "nav",
    target: "/profile",
    highlight: "checkins",
    cta: "Set up my check-ins"
  },
  {
    key: "trackers",
    n: 3,
    question: "Customize what you track.",
    body: "Turn trackers on or off, choose what shows on the mini log, and set goals for water, nutrients, exercise and bodywork. Come back and tick this done once you have.",
    kind: "nav",
    target: "/profile",
    highlight: "trackers",
    cta: "Customize trackers"
  },
  {
    key: "measurements",
    n: 4,
    question: "Track your measurements.",
    body: "A dated log of your measurements is kept in setup.",
    kind: "nav",
    target: "/profile",
    highlight: "measurements",
    cta: "Set up measurements"
  },
  {
    key: "garments",
    n: 5,
    question: "Are you wearing compression?",
    kind: "yesno",
    highlight: "garments",
    yes: { target: "/profile", cta: "Add my garments" }
  },
  {
    key: "meds",
    n: 6,
    question: "Do you take regular meds?",
    kind: "yesno",
    highlight: "meds",
    yes: { target: "/profile", cta: "Add my med groups" }
  },
  {
    key: "careteam",
    n: 7,
    question: "Would you like to add a care team member?",
    body: "They can view or update your log based on the permissions you give, and you can remove them at any time.",
    kind: "nav",
    target: "/care",
    highlight: "careteam",
    cta: "Add a care team member"
  },
  {
    key: "firstcheckin",
    n: 8,
    question: "Log your first check-in.",
    kind: "nav",
    target: "/",
    highlight: "firstcheckin",
    cta: "Open today"
  },
  {
    key: "pdf",
    n: 9,
    question: "View the PDF report.",
    body: "A day or a range, ready for a consultation.",
    kind: "nav",
    target: "/profile",
    highlight: "pdf",
    cta: "Open the PDF report"
  },
  {
    key: "redflags",
    n: 10,
    question: "Understand the red flags and customize your home screen.",
    kind: "nav",
    target: "/profile",
    highlight: "trackers",
    cta: "Open setup"
  }
];

export const loadOrientation = (patientId) => {
  try {
    const raw = window.localStorage.getItem(key(patientId));
    if (!raw) return { ...DEFAULT_ORIENTATION };
    return { ...DEFAULT_ORIENTATION, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ORIENTATION };
  }
};

export const saveOrientation = (patientId, state) => {
  try {
    window.localStorage.setItem(key(patientId), JSON.stringify(state));
  } catch {
    // A browser refusing storage just loses onboarding progress.
  }
};

export const allDone = (state) => ORIENTATION_ITEMS.every((it) => state.items[it.key]);
export const doneCount = (state) => ORIENTATION_ITEMS.filter((it) => state.items[it.key]).length;