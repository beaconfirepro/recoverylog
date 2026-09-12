import { asRows } from "@/lib/recoveryUtils";

// `filter()` answers with one page, and a page it was told the size of. Asking
// for 500 days was fine for a first recovery and silently wrong for a patient
// who logs every day: eighteen months is more than 500 days, and the page
// simply stopped at the 500th with no error, no "load more" and no sign that
// the rest of the record was still there. This asks for the next page until one
// comes back short.
//
// The Base44 SDK caps a single request at 5,000 rows, so the size is a number
// the caller picks per entity: a day row is small and there is one a day, an
// entry row is small and there can be a dozen a day.
export const PAGE_SIZE = 500;

// A backend that ignored `skip` would hand back the same page forever. This is
// the stop, and it is far past a real record: 40 pages of 500 is 20,000 rows.
export const MAX_PAGES = 40;

export const fetchAllRows = async (entity, query, sort, pageSize = PAGE_SIZE) => {
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows = asRows(await entity.filter(query, sort, pageSize, page * pageSize));
    out.push(...rows);
    // A short page is the last page. A read that came back as anything other
    // than a list is also the end of it, rather than a crash inside an effect.
    if (rows.length < pageSize) break;
  }
  return out;
};
