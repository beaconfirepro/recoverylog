import { describe, expect, it } from "vitest";
import { pendingCreates, pendingEntriesFor } from "@/lib/pending";

const item = (over = {}) => ({
  id: "q1",
  entity: "RecoveryEntry",
  op: "create",
  at: 1,
  args: [{ date: "2026-09-12", surgery_id: "s1", type: "meds" }],
  ...over
});

describe("pendingCreates", () => {
  it("returns nothing for a queue that is not a list", () => {
    expect(pendingCreates(null, "RecoveryEntry")).toEqual([]);
    expect(pendingCreates(undefined, "RecoveryEntry")).toEqual([]);
  });

  it("describes a queued create", () => {
    const [p] = pendingCreates([item()], "RecoveryEntry");
    expect(p.key).toBe("q1");
    expect(p.row.type).toBe("meds");
  });

  it("ignores updates, because the row they edit is already on screen", () => {
    expect(pendingCreates([item({ op: "update" })], "RecoveryEntry")).toEqual([]);
  });

  it("ignores another entity's writes", () => {
    expect(pendingCreates([item({ entity: "RecoveryDay" })], "RecoveryEntry")).toEqual([]);
  });

  it("ignores an item carrying no row", () => {
    expect(pendingCreates([item({ args: [] })], "RecoveryEntry")).toEqual([]);
    expect(pendingCreates([item({ args: undefined })], "RecoveryEntry")).toEqual([]);
  });

  it("oldest first, so the order she typed them is the order she reads them", () => {
    const out = pendingCreates(
      [item({ id: "b", at: 20 }), item({ id: "a", at: 10 })],
      "RecoveryEntry"
    );
    expect(out.map((p) => p.key)).toEqual(["a", "b"]);
  });
});

describe("pendingEntriesFor", () => {
  it("keeps only the day being looked at", () => {
    const q = [item({ id: "today" }), item({ id: "other", args: [{ date: "2026-09-11", surgery_id: "s1" }] })];
    const out = pendingEntriesFor(q, { date: "2026-09-12", surgeryIds: ["s1"] });
    expect(out.map((p) => p.key)).toEqual(["today"]);
  });

  it("keeps only the records the day is showing", () => {
    const q = [item({ id: "mine" }), item({ id: "theirs", args: [{ date: "2026-09-12", surgery_id: "s2" }] })];
    expect(pendingEntriesFor(q, { date: "2026-09-12", surgeryIds: ["s1"] }).map((p) => p.key)).toEqual(["mine"]);
  });

  it("takes every record the day is showing when more than one is open", () => {
    const q = [item({ id: "mine" }), item({ id: "theirs", args: [{ date: "2026-09-12", surgery_id: "s2" }] })];
    const out = pendingEntriesFor(q, { date: "2026-09-12", surgeryIds: ["s1", "s2"] });
    expect(out.map((p) => p.key)).toEqual(["mine", "theirs"]);
  });

  it("takes a single id that is not in a list", () => {
    expect(pendingEntriesFor([item()], { date: "2026-09-12", surgeryIds: "s1" })).toHaveLength(1);
  });
});
