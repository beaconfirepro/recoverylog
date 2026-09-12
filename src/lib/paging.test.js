import { describe, expect, it } from "vitest";
import { fetchAllRows, MAX_PAGES } from "@/lib/paging";

// The same contract the real `filter()` has: it returns at most the page size
// it was asked for, starting at the row it was asked to skip. Capping it lower
// here would make a one-pass loop look correct, which is the bug being fixed.
const fakeEntity = (rows, calls = []) => ({
  filter: async (query, sort, limit, skip = 0) => {
    calls.push({ query, sort, limit, skip });
    return rows.slice(skip, skip + limit);
  }
});

const days = (n) => Array.from({ length: n }, (_, i) => ({ id: i, date: `day-${i}` }));

describe("fetchAllRows", () => {
  it("reads a record that fits in one page, in one request", async () => {
    const calls = [];
    const out = await fetchAllRows(fakeEntity(days(9), calls), { patient_id: "p1" }, "-date", 10);
    expect(out).toHaveLength(9);
    expect(calls).toHaveLength(1);
  });

  it("keeps reading past the first page", async () => {
    // Eighteen months of daily logging. This is the case that used to come back
    // as the most recent 500 days with the rest of the record invisible.
    const calls = [];
    const out = await fetchAllRows(fakeEntity(days(550), calls), {}, "-date", 500);
    expect(out).toHaveLength(550);
    expect(out[549].date).toBe("day-549");
    expect(calls.map((c) => c.skip)).toEqual([0, 500]);
  });

  it("passes the query, the sort and the page size through unchanged", async () => {
    const calls = [];
    await fetchAllRows(fakeEntity(days(3), calls), { surgery_id: "s1" }, "created_date", 500);
    expect(calls[0]).toEqual({ query: { surgery_id: "s1" }, sort: "created_date", limit: 500, skip: 0 });
  });

  it("asks once more when the last page is exactly full", async () => {
    // A full page cannot be told from a last page, so the only honest thing to
    // do is ask again and get nothing.
    const calls = [];
    const out = await fetchAllRows(fakeEntity(days(20), calls), {}, "-date", 10);
    expect(out).toHaveLength(20);
    expect(calls).toHaveLength(3);
  });

  it("returns nothing for an empty record, without looping", async () => {
    const calls = [];
    expect(await fetchAllRows(fakeEntity([], calls), {}, "-date", 10)).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("stops rather than spinning when skip is ignored", async () => {
    const calls = [];
    const stuck = {
      filter: async (query, sort, limit) => {
        calls.push(limit);
        return days(limit);
      }
    };
    const out = await fetchAllRows(stuck, {}, "-date", 10);
    expect(calls).toHaveLength(MAX_PAGES);
    expect(out).toHaveLength(MAX_PAGES * 10);
  });

  it("treats a read that did not come back as a list as the end", async () => {
    const out = await fetchAllRows({ filter: async () => ({ error: "nope" }) }, {}, "-date", 10);
    expect(out).toEqual([]);
  });
});
