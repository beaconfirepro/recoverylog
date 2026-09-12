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

`.github/workflows/checks.yml` runs lint, tests and the build on every pull
request.

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
the bundle (`vite.config.js` → `__BUILD_COMMIT__`), and the front page prints it
in small type under the day. Two ways to read it:

- Open the app and read the line at the bottom of Today.
- Fetch the served `/assets/index-*.js` and grep it for
  `git rev-parse --short HEAD`.

Do not trust the Base44 editor's "last commit" for this. It reports the
builder's own last commit, not the branch tip, so it can read as tens of
minutes stale while main is seconds old — and it says nothing about what is
deployed.

If a checkpoint has not published after a long wait, say so plainly and let the
user publish from the Base44 UI. Do not spend credits to force it.
