import { base44 } from "@/api/base44Client";
import { asRows } from "@/lib/recoveryUtils";
import { inviteSuppressed } from "@/lib/inviteEmail";
import { FEVER_DEFAULT } from "@/lib/recovery";
import { todayStr, nowTime } from "@/lib/dates";

// Set by GuidedTours on each render so a tour's onStart/cleanup can reach the
// current patient and active surgery without going through React context.
export const tourCtx = { patientId: null, surgery: null };

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
  "Add people to your care team like a partner, a caregiver, or a provider.",
  "Click + to invite the person via email.",
  "The care team member will need to sign up for the app with the email you invited them.",
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
  "Four times are set by default. Keep the ones that suit you, or tap the x to remove one.",
  "Add a time with the green button.",
  "Choose which measures the check-in records. Turning one off keeps what's already logged."
];

const TRACKER_NOTES = [
  "Each surgery is set up on its own. Turn trackers on or off, and choose what shows on the day card.",
  "Pick which surgery to set up here — each keeps its own trackers.",
  "Turn on Water. A tracker with a goal draws a bar on the day page — the number is this entry, the fill is the day's total against the goal.",
  "Tick Card to show Water on each day's card.",
  "Set a goal — 64 oz — and the day page shows your progress toward it."
];

const MEASUREMENT_NOTES = [
  "Choose which spots the measurements tracker asks for, in this order.",
  "Tap a spot to turn it on or off. Turning one off keeps what's already recorded.",
  "Add your own — type a name and tap Add."
];

const MEDS_NOTES = [
  "Group your medicines so the Med tracker brings them up already ticked.",
  "Type a name for a new group, like AM Meds or PRN Pain.",
  "Tap the green button to add it.",
  "Tap a group to open it and see its medicines.",
  "Add a medicine to the group.",
  "Search for a medicine by name. Nothing is saved until you pick one."
];

const PDF_NOTES = [
  "Download a PDF for a single day or a range — ready for a consultation.",
  "Switch to All records to include every surgery in the report.",
  "By record runs each surgery end to end. One timeline puts every day in date order and names the record on each.",
  "Tap Download to build it. It carries the surgery, goals, care team, garments, meds, trends, red flags and questions."
];

const FIRSTCHECKIN_NOTES = [
  "Log an entry here. Tap a tracker to open its form.",
  "The check-in is the pinned button. Rate pain, swelling, mobility, mood, nausea and energy on one screen."
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
      { target: "garments-add", mark: "arrow", note: GARMENT_NOTES[2], ms: 8400, click: true, clickAt: 3000, markAt: 400, markGone: 7200 },
      { target: "garments-remove", find: "row", mark: "circle", note: GARMENT_NOTES[3], ms: 5200, waitFor: true, markAt: 400, markGone: 5000 }
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
      { target: "careteam-header", mark: "spot", note: CARE_NOTES[0], waitFor: true },
      { target: "careteam-add", mark: "circle", note: CARE_NOTES[1], waitFor: true, click: true, clickAt: 600, markAt: 400 },
      {
        target: "careteam-email",
        mark: "spot",
        note: CARE_NOTES[2],
        waitFor: true,
        type: ["careteam-email", "careteam-first", "careteam-last"],
        values: { "careteam-email": SAMPLE_EMAIL, "careteam-first": "Sample", "careteam-last": "Smith" },
        click: true,
        clickTarget: "careteam-submit",
        clickAt: 2600
      },
      {
        target: "careteam-code",
        waitFor: true,
        mark: "spot",
        note: CARE_NOTES[3],
        markAt: 600,
        arrowTarget: "careteam-done",
        click: true,
        clickTarget: "careteam-done",
        clickAt: 3600
      },
      { target: "careteam-row", waitFor: true, find: "row", mark: "spot", note: CARE_NOTES[4], click: true, clickAt: 2200 },
      { target: "careteam-resend", waitFor: true, mark: "arrow", note: CARE_NOTES[5], markAt: 400 },
      { target: "careteam-remove", waitFor: true, mark: "circle", note: CARE_NOTES[6], markAt: 400 }
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
      { target: "surgeries-header", mark: "spot", note: SURGERY_NOTES[0], ms: 3400, waitFor: true },
      { target: "surgeries-add", mark: "arrow", note: SURGERY_NOTES[1], ms: 3400, waitFor: true }
    ]
  },

  // The check-in tour waits on each step — the patient clicks Next when she's
  // read it and is ready to move on, so she has time to set her times and
  // measures at her own pace.
  checkins: {
    path: "/profile",
    steps: [
      { target: "checkin-card", mark: "spot", note: CHECKIN_NOTES[0], ms: 3200, waitFor: true, waitForTap: true },
      { target: "checkin-times", mark: "spot", note: CHECKIN_NOTES[1], ms: 3200, waitFor: true, waitForTap: true },
      { target: "checkin-add", mark: "arrow", note: CHECKIN_NOTES[2], ms: 3200, waitFor: true, waitForTap: true },
      { target: "checkin-records", mark: "spot", note: CHECKIN_NOTES[3], ms: 3200, waitFor: true, waitForTap: true }
    ]
  },

  // The trackers tour drives the real form: it opens the surgery picker, turns
  // Water on, ticks the Card box, and types 64 into the goal. These are real
  // writes the patient keeps — water with a 64 oz goal is a sensible default,
  // not sample data to clean up. clickIfOff and typeIfEmpty stop a re-run from
  // undoing what the patient already set.
  trackers: {
    path: "/profile",
    steps: [
      { target: "trackers-header", mark: "spot", note: TRACKER_NOTES[0], ms: 3200, waitFor: true },
      { target: "trackers-surgery-select", mark: "circle", note: TRACKER_NOTES[1], ms: 3400, waitFor: true, openSelect: true, clickAt: 2000, markAt: 400 },
      { target: "trackers-water-toggle", mark: "circle", note: TRACKER_NOTES[2], ms: 4200, waitFor: true, click: true, clickAt: 2000, clickIfOff: true, markAt: 400, markGone: 3800 },
      { target: "trackers-water-card", mark: "arrow", note: TRACKER_NOTES[3], ms: 3600, waitFor: true, waitForEnabled: true, click: true, clickAt: 2600, clickIfOff: true, markAt: 400 },
      { target: "trackers-water-goal", mark: "spot", note: TRACKER_NOTES[4], ms: 4600, waitFor: true, waitForEnabled: true, type: ["trackers-water-goal"], values: { "trackers-water-goal": "64" }, blur: true, markAt: 400 }
    ]
  },

  measurements: {
    path: "/profile",
    steps: [
      { target: "measurements-header", mark: "spot", note: MEASUREMENT_NOTES[0], ms: 4200, waitFor: true },
      { target: "measurements-spots", mark: "spot", note: MEASUREMENT_NOTES[1], ms: 4200, waitFor: true },
      { target: "measurements-add", mark: "arrow", note: MEASUREMENT_NOTES[2], ms: 4000, waitFor: true }
    ]
  },

  meds: {
    path: "/profile",
    steps: [
      { target: "meds-header", mark: "spot", note: MEDS_NOTES[0], waitFor: true },
      { target: "meds-add-input", mark: "spot", note: MEDS_NOTES[1], waitFor: true, type: ["meds-add-input"], values: { "meds-add-input": "Sample Group" }, blur: true, markAt: 400 },
      { target: "meds-add-btn", mark: "arrow", note: MEDS_NOTES[2], waitFor: true, click: true, clickAt: 1200, markAt: 400 },
      { target: "meds-group", mark: "circle", note: MEDS_NOTES[3], waitFor: true, click: true, clickAt: 1200, markAt: 400 },
      { target: "meds-add-med", mark: "arrow", note: MEDS_NOTES[4], waitFor: true, click: true, clickAt: 1200, markAt: 400 },
      { target: "meds-drug-search", mark: "spot", note: MEDS_NOTES[5], waitFor: true, type: ["meds-drug-search"], values: { "meds-drug-search": "gabapentin" }, blur: true, markAt: 400 }
    ],
    cleanup: async () => {
      const rows = asRows(await base44.entities.MedGroup.list("sort_order", 100));
      const mine = rows.filter((g) => g.name === "Sample Group");
      for (const g of mine) {
        try { await base44.entities.MedGroup.delete(g.id); } catch { /* already gone */ }
      }
    }
  },

  pdf: {
    path: "/profile",
    steps: [
      { target: "pdf-header", mark: "spot", note: PDF_NOTES[0], ms: 3200, waitFor: true },
      { target: "pdf-all-records", mark: "circle", note: PDF_NOTES[1], waitFor: true, click: true, clickAt: 600, clickIfOff: true, markAt: 400 },
      { target: "pdf-by-record", mark: "spot", note: PDF_NOTES[2], ms: 4400, waitFor: true },
      { target: "pdf-download", mark: "arrow", note: PDF_NOTES[3], ms: 3600, waitFor: true }
    ]
  },

  // Today's page loads its day and entries before the check-in button and the
  // red-flag card mount, so every step here waits for its target to appear
  // rather than assuming it is already on screen.
  // Water and meds have their own tours (trackers and meds). The first
  // check-in tour stays focused on the check-in itself.
  firstcheckin: {
    path: "/",
    steps: [
      { target: "firstcheckin-toggle", mark: "spot", note: FIRSTCHECKIN_NOTES[0], waitFor: true },
      { target: "firstcheckin-checkin", mark: "circle", note: FIRSTCHECKIN_NOTES[1], waitFor: true, click: true, clickAt: 1500, markAt: 400 }
    ]
  },

  redflags: {
    path: "/",
    steps: [
      { target: "redflags-card", mark: "spot", note: REDFLAG_NOTES[0], waitFor: true },
      { target: "redflags-card", mark: "spot", note: REDFLAG_NOTES[1], waitFor: true }
    ],
    // Create a temp entry with a high fever so the red-flag card shows a
    // sparkle — the thing the second note is explaining. The entry is
    // deleted again when the tour ends, however it ends.
    onStart: async () => {
      const { patientId, surgery } = tourCtx;
      if (!patientId || !surgery) return;
      const threshold = surgery.fever_threshold || FEVER_DEFAULT;
      try {
        await base44.entities.RecoveryEntry.create({
          date: todayStr(),
          type: "temp",
          patient_id: patientId,
          surgery_id: surgery.id,
          mode: surgery.mode,
          entry_time: nowTime(),
          data: { temp: String(threshold + 2) },
          client_id: "gtour-redflag"
        });
      } catch { /* best-effort demo */ }
    },
    cleanup: async () => {
      const { patientId } = tourCtx;
      if (!patientId) return;
      const entries = asRows(
        await base44.entities.RecoveryEntry.filter({ patient_id: patientId, type: "temp", date: todayStr() }, "-created_date", 50)
      );
      for (const e of entries) {
        if (e.client_id === "gtour-redflag") {
          try { await base44.entities.RecoveryEntry.delete(e.id); } catch { /* already gone */ }
        }
      }
    }
  }
};