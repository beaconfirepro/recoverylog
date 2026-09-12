# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Tests

`npm test` runs Vitest over the pure modules in `src/lib`. It needs no browser
and no backend; `vitest.config.js` is separate from `vite.config.js` precisely
so the Base44 plugin, which wants a live backend, stays out of the way.

What is covered is the logic that would be silently wrong rather than visibly
broken: the red flag rules, the day totals that reach a surgeon, the date
maths, the check-in and measurement defaults, the body map, and the invitation
masking. Components are not covered and do not need to be.

Logic worth testing belongs in `src/lib`, not inside a component. Two modules
were pulled out for exactly that reason (`clock.js` from `TimeInput`,
`invite.js` from `Care`), and one of them turned out to have a real hole in it.

The backend functions are tested too, without deploying them.
`base44/functions/__tests__/fakeBase44.js` stands a small in-memory backend in
place of the SDK (vitest aliases `npm:@base44/sdk` to it), so a function can be
run here. It honours the page size `filter()` is asked for and throws on
deleting a row that is not there, because both of those are what the real one
does and both have already caught a bug.

`.github/workflows/checks.yml` runs lint, tests and the build on every pull
request.

## Joining a care team

The patient adds someone by email on Care. That writes a `team_member` AppUser
row carrying a six-character `join_code`, a `dob_check`, and a copy of the
patient's name, and sends an invitation through
`base44.integrations.Core.SendEmail` (Base44's own sender, no key and no
provider to configure).

**It takes two things to open a log: the code, and the patient's date of
birth.** Neither is enough alone. The date of birth is not a secret — a sister
knows it — so the code is what proves the patient meant you; the code can be
overheard or forwarded, so the date of birth is what proves you are the person
she meant to read it to.

**The email carries neither.** Holding the address is what identifies you. Put
any of it in the same message and one mistyped letter hands over the lot. She
passes both on herself, and the code stays visible to her on the care team list
until the invitation is opened.

**The date is checked against a digest, never a stored copy.** `dob_check` is
SHA-256 of `` `${code}|${dob}` ``. RLS lets an invited account read its own row,
so a date sitting there in the clear would hand over the thing it is meant to
prove, and an invitation delivered to the wrong address would leak the patient's
date of birth to a stranger. Salting with the code means neither factor gives up
the other. `src/lib/joinCode.js`, with tests.

Rows written before codes have neither and cannot be opened. Rows written before
the second factor carry no `dob_check` and still open on the code alone, so a
care team that is already helping is not locked out.

**Both checks are still in the browser**, so they are only as strong as what
came before them: two browser-side checks are still two browser-side checks.
`linkPatient` does it properly — it reads the patient's own row under the
service role and compares the real date, ignoring the digest — and it is blocked
on the same API key as #40 and #48.

## Backend functions, and the one key that blocks them

`base44/functions/*/entry.ts` is **not deployed by committing it**. Deploying
needs `npx base44 functions deploy`, which needs either `npx base44 login`
(interactive, so no agent can do it) or `BASE44_API_KEY` in the environment.

Two functions are written, committed, and have never run:

| Function | What it closes |
| --- | --- |
| `deleteAccount` | Delete my account. Purges six tables scoped to the patient group, removes the care team's rows, deletes the login last so a failure leaves an empty account rather than orphaned medical records. |
| `linkPatient` | Issues #39 and #40. Decides which log an account can see, under the service role: starting a log, opening an invitation with the join code, and switching between logs already opened. |

### Why `linkPatient` matters

Everything downstream rests on `patient_id`, and today the browser writes it
with `updateMe`. So does `write_patient_id`, which is the only thing making a
care team read-only. Both are editable by anyone with a console, and the join
code that guards the first is compared in the browser too. Read-only is an
honest default that stops accidents; it is not a boundary until this runs.

### The day the key lands

1. `export BASE44_API_KEY=...`
2. `npx base44 functions deploy`
3. Three edits, all replacing an `updateMe` with a function call:
   - `src/components/ClaimAccess.jsx` → `startLog` becomes
     `base44.functions.invoke("linkPatient", { action: "start", first_name, last_name, dob })`,
     and `claim` becomes `{ action: "claim", join_code: code, dob }`.
   - `src/lib/PatientContext.jsx` → `claimMembership` calls
     `{ action: "claim", join_code: code, dob }`; `switchPatient` calls
     `{ action: "switch", patient_id: id }`; the `updateMe` in `load()` goes.
   - `src/pages/Care.jsx` needs no change: it already goes through
     `claimMembership` and `switchPatient`.
4. Then, and only then, lock `patient_id` and `write_patient_id` on `User` so
   the browser cannot write them. Doing this before step 3 locks everyone out.

## Shipping (read this before saying anything is done)

**Never call `edit_base44_app`.** It runs the Base44 builder agent and spends
the account's credits. Development happens in this repository precisely because
those credits are not available. There is no situation where an agent working
here should spend them.

Publishing is `mcp__Base44__create_checkpoint`, after syncing the sandbox with
`git merge --ff-only origin/main`. It is not instant and has taken well over an
hour. A stale bundle shortly after a checkpoint is not a fault and is not a
reason to reach for the builder.

**How to tell what is actually deployed.** Every build stamps its commit into
the bundle (`vite.config.js` → `__BUILD_COMMIT__`), and You prints it in small
type at the foot of the page. Two ways to read it:

- Open the app and read the line at the bottom of You.
- Fetch the served `/assets/index-*.js` and grep it for
  `git rev-parse --short HEAD`.

Do not trust the Base44 editor's "last commit" for this. It reports the
builder's own last commit, not the branch tip, so it can read as tens of
minutes stale while main is seconds old — and it says nothing about what is
deployed.

If a checkpoint has not published after a long wait, say so plainly and let the
user publish from the Base44 UI. Do not spend credits to force it.
