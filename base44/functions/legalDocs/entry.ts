import { createClientFromRequest } from "npm:@base44/sdk";

// The current terms, served to any signed-in account.
//
// LegalDoc is deliberately not readable from the browser. An entity with no
// read rule is denied, not opened, and that is the behaviour we want here: the
// documents are the app's own terms rather than anybody's data, so there is
// exactly one door to them and it is this function. Writing is the same story:
// a legal document that any account could rewrite, in a table every account
// reads, is not a legal document.
//
// The caller only has to be signed in. The consent gate cannot ask you to
// accept what it may not show you.

const KINDS = ["privacy", "permissions", "pii_sharing"];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const rows =
      (await base44.asServiceRole.entities.LegalDoc.filter({ current: true }, "kind", 20)) || [];

    // One current document per kind is the contract the gate relies on. Fewer
    // means the seed is incomplete; more means two rows claim to be current and
    // we cannot say which one a person agreed to. Both are our fault, and both
    // must read as a failure rather than as "nothing to agree to".
    const current = KINDS.map((kind) => rows.filter((r: { kind: string }) => r.kind === kind));
    const missing = KINDS.filter((_, i) => current[i].length === 0);
    const duplicated = KINDS.filter((_, i) => current[i].length > 1);

    if (missing.length || duplicated.length) {
      return Response.json(
        {
          error:
            (missing.length ? `No current document for: ${missing.join(", ")}. ` : "") +
            (duplicated.length ? `More than one current document for: ${duplicated.join(", ")}.` : "")
        },
        { status: 500 }
      );
    }

    return Response.json({
      docs: current.map(([d]) => ({
        kind: d.kind,
        version: d.version,
        title: d.title,
        summary: d.summary,
        body: d.body
      }))
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "The terms could not be read." }, { status: 500 });
  }
}
