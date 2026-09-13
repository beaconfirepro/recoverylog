import { base44 } from "@/api/base44Client";
import { asRows } from "@/lib/recoveryUtils";
import { inviteSuppressed } from "@/lib/inviteEmail";

// Guided tours for the orientation checklist, in the garment tour's shape: each
// step lights one thing, optionally marks it, and — for the steps that need it
// — actually does the action (type a sample, press add, open a row). Whatever a
// tour creates it removes when it finishes, including when it is skipped or the
// patient navigates away mid-tour, so a leftover sample is never left for someone
// to find and delete.
//
// `target` is a [data-gtour] attribute in the page. A step with `find: "row"`
// looks for a row whose text contains `rowMatch` (under `rowSelector`) and
// returns the row, or its `rowChild` element when one is set.

const GARMENT_NOTES = [
  "Add your compression garments for easy tracking.",
  "Use the colour, brand, or whatever makes sense to identify it, and track the size so you know if you need to size down or what you are replacing.",
  "Add the garment to your list and it will be available for all surgeries and maintenance to select when tracking compression garment use.",
  "If you no longer use a compression garment, click the x to remove it from your list. It will not disappear from your logs."
];

const CARE_NOTES = [
  "Add other people to your care team. This can be a partner, a caregiver, a provider, or even another patient that you want to share your journey with.",
  "Click + to invite the person via email.",
  "They will need to sign up for the app with that email address or already use that one.",
  "To see your info, they need this invite code, your first and last name, and birthdate.",
  "To see if they have accepted the invite, click the title to expand it.",
  "If they need the invitation resent, click here to resend it.",
  "If you want to withdraw their permission or the invite, click remove to prevent them from accessing your account."
];

const SAMPLE_EMAIL = "sample@lipnode.com";

// Notes for the eight orientation tours. These run through the GuidedTours
// engine and light one thing at a time with a single line about it — the same
// shape as the garment and care-team tours above, minus the live form driving.
// Driving the forms (typing a sample slot, saving a sample surgery) needs the
// page to refresh mid-tour, which these pages do not subscribe to; the
// spotlight-and-explain versions are honest about where each thing is and what
// it does, and leave the patient to try the real thing themselves.

const SURGERY_NOTES = [
  "Your surgery logs live here. Each keeps its own days, counted from the surgery date.",
  "Tap + to add a surgery — its date becomes day zero, and you can log before and after it."
];

const CHECKIN_NOTES = [
  "The check-in rates pain, swelling, mobility, mood, nausea and energy on one screen.",
  "Four times are set by default. Keep the ones that suit you.",
  "Tap the x to remove a time you don't need.",
  "Add a time with the green button.",
  "Choose which measures the check-in records. Turning one off keeps what's already logged."
];

const TRACKER_NOTES = [
  "Each surgery is set up on its own. Turn trackers on or off, and choose what shows on the day card.",
  "Water is on here. A tracker with a goal draws a bar on the day page — the number is this entry, the fill is the day's total against the goal.",
  "Set a goal and the day page shows your progress toward it. Water, nutrients and bodywork each take one."
];

const MEASUREMENT_NOTES = [
  "Choose which spots the measurements tracker asks for, in this order.",
  "Tap a spot to turn it on or off. Turning one off keeps what's already recorded.",
  "Add your own — type a name and tap Add."
];

const MEDS_NOTES = [
  "Group your medicines so the Med tracker brings them up already ticked.",
  "Tap a group to open it — dose, reason, and a drug lookup for adding one.",
  "Add a group with the green button."
];

const PDF_NOTES = [
  "Download a PDF for a single day or a range — ready for a consultation.",
  "Pick the dates. A range stops at the limit so nothing is left out.",
  "Tap Download to build it. It carries the surgery, goals, care team, garments, meds, trends, red flags and questions."
];

const FIRSTCHECKIN_NOTES = [
  "Log an entry here. Tap a tracker to open its form.",
  "The check-in is the pinned button. Rate pain, swelling, mobility, mood, nausea and energy on one screen.",
  "Log water here — each entry adds to the day's total against your goal.",
  "Log meds here — pick a group and the medicines come up already ticked."
];

const REDFLAG_NOTES = [
  "Twelve things that most often mean call someone after this surgery. Answer them once a day.",
  "A sparkle means something you logged looks like a yes. Tap either answer to override it — the app only ever suggests yes, so it can never talk you out of a flag."
];

export const TOURS = {
  garments: {
    path: "/profile",
    rowSelector: '[data-gtour="garments-row"]',
    rowMatch: "Sample Garment",
    rowChild: '[data-gtour="garments-remove"]',
    steps: [
      { target: "garments-header", mark: "spot", note: GARMENT_NOTES[0], ms: 1200 },
      {
        target: "garments-inputs",
        mark: "spot",
        note: GARMENT_NOTES[1],
        ms: 3600,
        type: ["garments-name", "garments-size"],
        values: { "garments-name": "Sample Garment", "garments-size": "Size M" }
      },
      { target: "garments-add", mark: "arrow", note: GARMENT_NOTES[2], ms: 8400, click: true, clickAt: 3000, markAt: 1200, markGone: 7200 },
      { target: "garments-remove", find: "row", mark: "circle", note: GARMENT_NOTES[3], ms: 5200, waitFor: true, markAt: 1200, markGone: 5000 }
    ],
    // The tour really saves "Sample Garment / Size M" to make the demonstration
    // convincing; remove it again when the tour ends, however it ends.
    cleanup: async () => {
      const rows = asRows(await base44.entities.Garment.list("sort_order", 100));
      const mine = rows.filter((g) => g.name === "Sample Garment" && g.size === "Size M");
      for (const g of mine) {
        try { await base44.entities.Garment.delete(g.id); } catch { /* already gone */ }
      }
    }
  },

  careteam: {
    path: "/care",
    rowSelector: '[data-gtour="careteam-row"]',
    rowMatch: SAMPLE_EMAIL,
    steps: [
      { target: "careteam-header", mark: "spot", note: CARE_NOTES[0], ms: 4400 },
      { target: "careteam-add", mark: "circle", note: CARE_NOTES[1], ms: 3000, markAt: 400, click: true, clickAt: 2000 },
      {
        target: "careteam-email",
        mark: "spot",
        note: CARE_NOTES[2],
        ms: 8000,
        type: ["careteam-email", "careteam-first", "careteam-last"],
        values: { "careteam-email": SAMPLE_EMAIL, "careteam-first": "Sample", "careteam-last": "Smith" },
        click: true,
        clickTarget: "careteam-submit",
        clickAt: 7200
      },
      {
        target: "careteam-code",
        waitFor: true,
        mark: "spot",
        note: CARE_NOTES[3],
        ms: 4400,
        markAt: 600,
        arrowTarget: "careteam-done",
        click: true,
        clickTarget: "careteam-done",
        clickAt: 3600
      },
      { target: "careteam-row", waitFor: true, find: "row", mark: "spot", note: CARE_NOTES[4], ms: 3000, click: true, clickAt: 2200 },
      { target: "careteam-resend", waitFor: true, mark: "arrow", note: CARE_NOTES[5], ms: 3200, markAt: 400 },
      { target: "careteam-remove", waitFor: true, mark: "circle", note: CARE_NOTES[6], ms: 3600, markAt: 400 }
    ],
    // The tour drives the real form, which would send a real invitation to a
    // made-up address. Suppress the send for the whole run; the form still shows
    // its "sent" screen, which is what the tour is demonstrating. The sample
    // member is removed again when the tour ends.
    onStart: () => { inviteSuppressed.current = true; },
    cleanup: async () => {
      inviteSuppressed.current = false;
      const rows = asRows(
        await base44.entities.AppUser.filter({ email: SAMPLE_EMAIL, kind: "team_member" }, "created_date", 50)
      );
      for (const r of rows) {
        try { await base44.entities.AppUser.delete(r.id); } catch { /* already gone */ }
      }
    }
  },

  surgery: {
    path: "/profile",
    steps: [
      { target: "surgeries-header", mark: "spot", note: SURGERY_NOTES[0], ms: 3400 },
      { target: "surgeries-add", mark: "arrow", note: SURGERY_NOTES[1], ms: 3400 }
    ]
  },

  checkins: {
    path: "/profile",
    steps: [
      { target: "checkin-card", mark: "spot", note: CHECKIN_NOTES[0], ms: 3200 },
      { target: "checkin-times", mark: "spot", note: CHECKIN_NOTES[1], ms: 3000 },
      { target: "checkin-remove", mark: "circle", note: CHECKIN_NOTES[2], ms: 2600 },
      { target: "checkin-add", mark: "arrow", note: CHECKIN_NOTES[3], ms: 2600 },
      { target: "checkin-records", mark: "spot", note: CHECKIN_NOTES[4], ms: 3600 }
    ]
  },

  trackers: {
    path: "/profile",
    steps: [
      { target: "trackers-header", mark: "spot", note: TRACKER_NOTES[0], ms: 3200 },
      { target: "trackers-water", mark: "circle", note: TRACKER_NOTES[1], ms: 3800 },
      { target: "trackers-goals", mark: "spot", note: TRACKER_NOTES[2], ms: 3400 }
    ]
  },

  measurements: {
    path: "/profile",
    steps: [
      { target: "measurements-header", mark: "spot", note: MEASUREMENT_NOTES[0], ms: 3200 },
      { target: "measurements-spots", mark: "spot", note: MEASUREMENT_NOTES[1], ms: 3200 },
      { target: "measurements-add", mark: "arrow", note: MEASUREMENT_NOTES[2], ms: 3000 }
    ]
  },

  meds: {
    path: "/profile",
    steps: [
      { target: "meds-header", mark: "spot", note: MEDS_NOTES[0], ms: 3200 },
      { target: "meds-list", mark: "spot", note: MEDS_NOTES[1], ms: 3200 },
      { target: "meds-add", mark: "arrow", note: MEDS_NOTES[2], ms: 3000 }
    ]
  },

  pdf: {
    path: "/profile",
    steps: [
      { target: "pdf-header", mark: "spot", note: PDF_NOTES[0], ms: 3200 },
      { target: "pdf-range", mark: "spot", note: PDF_NOTES[1], ms: 3200 },
      { target: "pdf-download", mark: "arrow", note: PDF_NOTES[2], ms: 3600 }
    ]
  },

  // Today's page loads its day and entries before the check-in button and the
  // red-flag card mount, so every step here waits for its target to appear
  // rather than assuming it is already on screen.
  firstcheckin: {
    path: "/",
    steps: [
      { target: "firstcheckin-toggle", mark: "spot", note: FIRSTCHECKIN_NOTES[0], ms: 3000, waitFor: true },
      { target: "firstcheckin-checkin", mark: "circle", note: FIRSTCHECKIN_NOTES[1], ms: 3600, waitFor: true },
      { target: "firstcheckin-water", mark: "circle", note: FIRSTCHECKIN_NOTES[2], ms: 3200, waitFor: true },
      { target: "firstcheckin-med", mark: "circle", note: FIRSTCHECKIN_NOTES[3], ms: 3200, waitFor: true }
    ]
  },

  redflags: {
    path: "/",
    steps: [
      { target: "redflags-card", mark: "spot", note: REDFLAG_NOTES[0], ms: 3600, waitFor: true },
      { target: "redflags-card", mark: "spot", note: REDFLAG_NOTES[1], ms: 3800, waitFor: true }
    ]
  }
};