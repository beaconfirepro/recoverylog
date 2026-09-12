import { describe, expect, it, vi } from "vitest";
import { MAX_QUEUED, enqueue, isQueueable, makeItem, newClientId, remove, replay } from "@/lib/writeQueue";

const item = (over = {}) =>
  makeItem({ entity: "RecoveryEntry", op: "create", args: [{ type: "water" }], ...over });

describe("newClientId", () => {
  it("does not repeat itself", () => {
    const seen = new Set(Array.from({ length: 2000 }, newClientId));
    expect(seen.size).toBe(2000);
  });
});

describe("isQueueable", () => {
  it("takes the two operations that can be replayed", () => {
    expect(isQueueable({ entity: "RecoveryEntry", op: "create", args: [] })).toBe(true);
    expect(isQueueable({ entity: "RecoveryDay", op: "update", args: [] })).toBe(true);
  });

  it("refuses a delete", () => {
    // Replaying a delete against a row that has since been re-created destroys
    // the new one. Deletes stay manual.
    expect(isQueueable({ entity: "RecoveryEntry", op: "delete", args: [] })).toBe(false);
  });

  it("refuses anything malformed", () => {
    expect(isQueueable(null)).toBe(false);
    expect(isQueueable({ op: "create", args: [] })).toBe(false);
    expect(isQueueable({ entity: "X", op: "create" })).toBe(false);
  });
});

describe("enqueue", () => {
  it("holds a write", () => {
    expect(enqueue([], item())).toHaveLength(1);
  });

  it("does not hold the same create twice", () => {
    const a = item({ clientId: "c1" });
    expect(enqueue(enqueue([], a), item({ clientId: "c1" }))).toHaveLength(1);
  });

  it("holds two different creates", () => {
    const q = enqueue(enqueue([], item({ clientId: "c1" })), item({ clientId: "c2" }));
    expect(q).toHaveLength(2);
  });

  it("drops the oldest rather than growing without limit", () => {
    let q = [];
    for (let i = 0; i < MAX_QUEUED + 10; i += 1) q = enqueue(q, item({ clientId: `c${i}` }));
    expect(q).toHaveLength(MAX_QUEUED);
    expect(q[0].clientId).toBe("c10");
  });

  it("copes with nothing stored yet", () => {
    expect(enqueue(undefined, item())).toHaveLength(1);
    expect(enqueue(null, item())).toHaveLength(1);
  });
});

describe("replay", () => {
  const ok = () => ({ send: vi.fn().mockResolvedValue(true), exists: vi.fn().mockResolvedValue(false) });

  it("sends what is held and empties the queue", async () => {
    const io = ok();
    const q = [item({ clientId: "c1" }), item({ clientId: "c2" })];
    const out = await replay(q, io);
    expect(io.send).toHaveBeenCalledTimes(2);
    expect(out.queue).toHaveLength(0);
    expect(out.done).toHaveLength(2);
  });

  it("never sends a create whose row already landed", async () => {
    // The failure that matters. She logged it, it failed, she typed it again,
    // and then the queue drained — and the surgeon's PDF has it twice. A
    // duplicated entry is worse than a missing one: missing is incomplete,
    // duplicated is wrong.
    const io = { send: vi.fn().mockResolvedValue(true), exists: vi.fn().mockResolvedValue(true) };
    const out = await replay([item({ clientId: "c1" })], io);
    expect(io.send).not.toHaveBeenCalled();
    expect(out.skipped).toHaveLength(1);
    expect(out.queue).toHaveLength(0);
  });

  it("does not ask about an update, because replaying one is not a duplicate", async () => {
    const io = ok();
    await replay([item({ op: "update", clientId: "c1", args: ["row1", {}] })], io);
    expect(io.exists).not.toHaveBeenCalled();
    expect(io.send).toHaveBeenCalledTimes(1);
  });

  it("stops at the first failure and keeps the rest", async () => {
    // Draining against a dead network turns one failure into fifty.
    const send = vi.fn().mockRejectedValue(new Error("offline"));
    const out = await replay([item({ clientId: "c1" }), item({ clientId: "c2" })], {
      send,
      exists: vi.fn().mockResolvedValue(false)
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(out.queue).toHaveLength(2);
    expect(out.done).toHaveLength(0);
  });

  it("keeps the ones it did not reach, in order", async () => {
    const send = vi.fn().mockResolvedValueOnce(true).mockRejectedValue(new Error("offline"));
    const q = [item({ clientId: "c1" }), item({ clientId: "c2" }), item({ clientId: "c3" })];
    const out = await replay(q, { send, exists: vi.fn().mockResolvedValue(false) });
    expect(out.done).toHaveLength(1);
    expect(out.queue.map((i) => i.clientId)).toEqual(["c2", "c3"]);
  });

  it("does not fail on a lookup that throws", async () => {
    const io = { send: vi.fn(), exists: vi.fn().mockRejectedValue(new Error("offline")) };
    const out = await replay([item({ clientId: "c1" })], io);
    // Unable to say whether it landed, so it is not sent. Held, not guessed at.
    expect(io.send).not.toHaveBeenCalled();
    expect(out.queue).toHaveLength(1);
  });

  it("copes with an empty queue", async () => {
    const io = ok();
    expect((await replay([], io)).queue).toHaveLength(0);
    expect((await replay(undefined, io)).queue).toHaveLength(0);
  });
});

describe("remove", () => {
  it("takes one out by id", () => {
    const a = item({ clientId: "c1" });
    expect(remove([a], a.id)).toHaveLength(0);
  });

  it("copes with nothing", () => {
    expect(remove(null, "x")).toEqual([]);
  });
});
