// A backend small enough to reason about, so the functions can be run without
// deploying them. Entities are plain arrays; the service role is the same store
// with no rules over it, which is what asServiceRole means on the real thing.
//
// The point of this is not to prove Base44 works. It is to prove that what our
// function asks Base44 to do is the right set of deletions, in the right order,
// scoped to the right person.

let state = null;

const matches = (row, query) => Object.entries(query).every(([k, v]) => row[k] === v);

const makeEntities = (log) =>
  new Proxy(
    {},
    {
      get: (_t, name) => ({
        // Honours the page size it is asked for, because that is the whole
        // contract the function's paging loop is written against. Capping it
        // lower here would make a one-pass loop look correct.
        filter: async (query, _sort, limit) => {
          const hits = (state.tables[name] || []).filter((r) => matches(r, query));
          return typeof limit === "number" ? hits.slice(0, limit) : hits;
        },
        delete: async (id) => {
          const rows = state.tables[name] || [];
          const i = rows.findIndex((r) => r.id === id);
          if (i === -1) throw new Error(`${name} ${id} does not exist`);
          rows.splice(i, 1);
          log.push(`${name}:${id}`);
        },
        create: async (data) => {
          const row = { id: `${name}_${state.seq++}`, ...data };
          (state.tables[name] ||= []).push(row);
          log.push(`create ${name}:${row.id}`);
          return row;
        },
        update: async (id, patch) => {
          const row = (state.tables[name] || []).find((r) => r.id === id);
          if (!row) throw new Error(`${name} ${id} does not exist`);
          Object.assign(row, patch);
          log.push(`update ${name}:${id}`);
          return row;
        }
      })
    }
  );

export const setBackend = ({ me, tables }) => {
  const log = [];
  state = { me, tables, seq: 1, log };
  return state;
};

export const deletions = () => state.log;
export const table = (name) => state.tables[name] || [];

export function createClientFromRequest() {
  const log = state.log;
  return {
    auth: { me: async () => state.me },
    entities: makeEntities(log),
    asServiceRole: { entities: makeEntities(log) }
  };
}
