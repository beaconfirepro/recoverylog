import { describe, expect, it } from "vitest";
import { announce, announceNow, currentAnnouncements, distinct, subscribeAnnouncements } from "@/lib/announce";

// The lanes are module state, so these read it as it accumulates rather than
// pretending each test starts from nothing.

describe("distinct", () => {
  it("leaves a new message alone", () => {
    expect(distinct("Saved. Your entry is saved.", "Deleted. Your entry is off this day.")).toBe(
      "Deleted. Your entry is off this day."
    );
  });

  it("marks a repeat so the region changes and is read again", () => {
    expect(distinct("Saved.", "Saved.")).toBe("Saved. ");
    // And back, so a third identical save is heard too.
    expect(distinct("Saved. ", "Saved.")).toBe("Saved.");
  });
});

describe("announce", () => {
  it("reaches whoever is listening, and stops when they go", () => {
    const heard = [];
    const stop = subscribeAnnouncements((lanes) => heard.push(lanes.polite));
    announce("Saved. Your entry is saved.");
    stop();
    announce("Saved. Your questions are saved.");
    expect(heard).toEqual(["Saved. Your entry is saved."]);
  });

  it("keeps the two lanes apart, so a save cannot overwrite a log switch", () => {
    announceNow("Now viewing Jane Dale's log.");
    announce("Saved. Your entry is saved.");
    announce("Saved. Your entry is saved.");
    const lanes = currentAnnouncements();
    // The second identical save carries the marker; the log switch is untouched
    // by either of them.
    expect(lanes.polite).toBe("Saved. Your entry is saved. ");
    expect(lanes.assertive).toBe("Now viewing Jane Dale's log.");
  });

  it("ignores nothing said at all, rather than blanking the region", () => {
    const before = currentAnnouncements();
    announce("");
    announce(null);
    expect(currentAnnouncements()).toEqual(before);
  });

  it("hands out a copy, so a listener cannot edit the lanes", () => {
    const lanes = currentAnnouncements();
    lanes.polite = "tampered";
    expect(currentAnnouncements().polite).not.toBe("tampered");
  });
});
