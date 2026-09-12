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
  }
};