import { describe, expect, it } from "vitest";
import { buzz, deletedNote, failedNote, failureReason, savedNote, teamCopyError } from "@/lib/saveNotes";

// These are the words a failed save says. A wrong one here is the difference
// between a patient retyping an entry and a patient believing it is logged.

describe("buzz", () => {
  it("buzzes where the browser has it", () => {
    const calls = [];
    expect(buzz({ vibrate: (ms) => calls.push(ms) || true }, 10)).toBe(true);
    expect(calls).toEqual([10]);
  });

  it("says no on iOS Safari, which has no vibrate at all", () => {
    expect(buzz({}, 10)).toBe(false);
    expect(buzz(null, 10)).toBe(false);
  });

  it("says no when the browser has it and refuses the call", () => {
    expect(buzz({ vibrate: () => false })).toBe(false);
    expect(
      buzz({
        vibrate: () => {
          throw new Error("blocked without a user gesture");
        }
      })
    ).toBe(false);
  });
});

describe("failureReason", () => {
  it("blames the network before anything the error claims", () => {
    expect(failureReason(new Error("Request failed"), false)).toBe("This device is offline.");
  });

  it("prefers a message the app wrote for her", () => {
    const err = new Error("raw");
    err.userMessage = "Two of three care team rows still show the old name";
    expect(failureReason(err, true)).toBe("Two of three care team rows still show the old name.");
  });

  it("passes a short backend message through, punctuated", () => {
    expect(failureReason(new Error("That date is outside the surgery"), true)).toBe(
      "That date is outside the surgery."
    );
    expect(failureReason(new Error("Already punctuated."), true)).toBe("Already punctuated.");
  });

  it("keeps a stack trace out of the toast", () => {
    expect(failureReason(new Error("boom\n    at save (DayView.jsx:127)"), true)).toBe(
      "The save didn't reach the server."
    );
    expect(failureReason(new Error("x".repeat(200)), true)).toBe("The save didn't reach the server.");
  });

  it("has something to say about an error with nothing in it", () => {
    expect(failureReason(undefined, true)).toBe("The save didn't reach the server.");
    expect(failureReason({}, true)).toBe("The save didn't reach the server.");
  });
});

describe("savedNote and deletedNote", () => {
  it("confirms in one line", () => {
    expect(savedNote("Your entry")).toEqual({ title: "Saved", description: "Your entry is saved." });
    expect(deletedNote("Your entry")).toEqual({ title: "Deleted", description: "Your entry is off this day." });
  });

  it("takes a written sentence where the default would read wrong", () => {
    expect(savedNote("Your details", "Your name is updated everywhere it appears.").description).toBe(
      "Your name is updated everywhere it appears."
    );
  });
});

describe("failedNote", () => {
  it("names what failed and what to do, never just that something went wrong", () => {
    const note = failedNote("Your entry", new Error("Network request failed"), { online: true });
    expect(note.variant).toBe("destructive");
    expect(note.title).toBe("Your entry didn't save");
    expect(note.description).toBe(
      "Network request failed. Nothing you typed is lost. Tap Retry to send it again."
    );
  });

  it("takes a headline and advice for a write that is not a save", () => {
    const note = failedNote("Your entry", new Error("nope"), {
      online: true,
      title: "Your entry is still here",
      advice: "Tap Retry to delete it again."
    });
    expect(note.title).toBe("Your entry is still here");
    expect(note.description).toBe("nope. Tap Retry to delete it again.");
  });

  it("lets an error the app wrote carry its own headline", () => {
    const note = failedNote("Your details", teamCopyError(2, 3), { online: true });
    expect(note.title).toBe("Your care team kept the old name");
  });
});

describe("teamCopyError", () => {
  it("says the name is saved and where it is not", () => {
    expect(teamCopyError(2, 3).userMessage).toBe(
      "Your name is saved on your log, but 2 of 3 care team rows still show the old one."
    );
  });

  it("counts one row as a row", () => {
    expect(teamCopyError(1, 1).userMessage).toBe(
      "Your name is saved on your log, but 1 of 1 care team row still shows the old one."
    );
  });
});
