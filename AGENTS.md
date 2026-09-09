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

## Shipping (read this before saying anything is done)

Merging is not shipping. `create_checkpoint` records the commit and does not
reliably publish: on 9 September 2026 nine checkpoints across two and a half
hours left the site on a bundle from before any of them.

What publishes is the platform's own build, kicked with
`mcp__Base44__edit_base44_app`. Use an instruction that changes nothing:

> Rebuild and publish the app from the current main branch. Do not change any
> code, styling, entities or copy — the repository is already correct and every
> change is merged. Just build and deploy what is in the repo now.

After every merge, without being asked:

1. Sync the sandbox: `git merge --ff-only origin/main`.
2. Create a checkpoint.
3. Kick the build with `edit_base44_app`.
4. **Verify it is live.** Every build stamps its commit into the bundle
   (`vite.config.js` → `__BUILD_COMMIT__`), and the front page prints it in
   small type under the day. Two ways to read it, both authoritative:

   - Open the app and read the line at the bottom of Today.
   - Fetch the served `/assets/index-*.js` and grep it for
     `git rev-parse --short HEAD`.

   Do not trust the Base44 editor's "last commit" for this. It reports the
   builder's own last commit, not the branch tip, so it can read as tens of
   minutes stale while main is seconds old — and it says nothing at all about
   what is deployed.
5. Still stale after the builder reports finished → kick it again. Do not
   report the work as done, and do not hand the publish back to the user.

Never tell the user a change is on the site without step 4.
