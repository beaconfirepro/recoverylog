# LipNode FAQ

**The FAQ now lives in the app.** This file is a pointer, not a second copy.

The content is seeded into the `HelpDoc` table from
[`base44/seed/help-docs.json`](../base44/seed/help-docs.json), split into two
rows that are deliberately kept apart:

| `kind` | Title | For |
| --- | --- | --- |
| `patient` | For patients | Someone who owns a log |
| `care_team` | For care team members | Someone reading one |

It is read at **You → Help & FAQ** (`src/components/help/HelpSection.jsx`,
through `src/lib/help.js`) and rendered by the same `DocReader` as the legal
documents. Two question-mark hints link into it from the screens that actually
raise the questions: the join-code forms and the red flag card.

## Why it is a seeded record rather than this file

Help goes stale every time the app changes underneath it — more often than the
legal documents do. A record can be corrected without a deploy. A markdown file
in the repo can only be corrected by shipping.

Unlike a `LegalDoc` this is not consent: nothing is version-gated, nothing is
recorded against an account, and a failed read hides the help rather than
stopping the app. Somebody not finding an answer is a bad afternoon; the consent
gate failing open is a different kind of problem.

## Editing it

Edit `base44/seed/help-docs.json` and re-seed. The body is plain text in
`DocReader`'s format:

- a line in capitals ending in a colon is a section heading
- a short line on its own ending in a question mark is a question
- everything else is a paragraph

Keep every question to one short line, or it renders as body text.

## Still open

`HelpHint` links to the You screen rather than deep-linking to the relevant
answer — see #118. The Contact us form the patient page mentions is #119.
