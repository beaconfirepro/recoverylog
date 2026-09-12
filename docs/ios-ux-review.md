# LipNode iOS UX & copy review

Reviewed 2026-09-12 against the repository at this commit. 53 recommendations across 8 sections: 5 critical, 15 high, 24 medium, 9 low.

Every item cites the file it came from. Nothing here is a guess about behaviour: where the recommendation rests on what the code does, the evidence line says where to look.

**How to answer this.** The same list is published as a tickable review sheet — yes / no / yes with changes, plus a notes box per item — which exports the answers as JSON. The machine-readable source of both is `docs/ios-ux-review.json`; item IDs are stable, so an answer set can be applied against this file directly.

## Contents

- **Copy that is wrong** (7) — Text that states something the app does not do. These cost trust first and correctness second, and two of them sit inside documents users must accept before they can start.
- **Names and labels** (6) — The same thing called two things, or a thing called by the wrong name. Cheap to fix, and every one of them is a moment where the user stops trusting their own reading.
- **Navigation and structure** (9) — Where things live and how you get between them. One of these makes a whole class of day unreachable.
- **iOS platform** (12) — What the app owes an iPhone specifically: touch targets, type size, install, offline, and what happens when a save fails on bad signal.
- **Red flags and safety** (6) — The red flag check is the most consequential screen in the app and currently the least designed. Three of these twelve questions are emergency-room questions treated the same as a mild one.
- **Getting started and joining** (5) — First run for a patient, and the join-code handoff for a care team member.
- **Accessibility** (5) — Colour-only meaning, unannounced state changes, and semantics that do not match what the control looks like.
- **Help and FAQ** (3) — There is no help surface anywhere in the app. The FAQ content is written and sitting in docs/faq.md; these are about where it goes.

## Copy that is wrong

Text that states something the app does not do. These cost trust first and correctness second, and two of them sit inside documents users must accept before they can start.

### COPY-1 · The privacy policy ships with unfilled placeholders

**Severity** critical  
**Where** `base44/seed/legal-docs.json — privacy body`

Users must read and accept this document before they can type anything medical. It currently contains [[CONTROLLER: legal name and address]], [[MINIMUM AGE]], [[CONTACT: name and email for privacy questions]] and two [[LEGAL: ...]] notes-to-self, all rendered verbatim by DocReader.

**Recommendation.** Fill the three user-facing placeholders and delete the two [[LEGAL:]] notes before the next publish. If the controller details are not settled, the document is not ready to be presented as accepted terms.

### COPY-2 · Two consent documents promise write access that does not exist

**Severity** critical  
**Where** `base44/seed/legal-docs.json — pii_sharing: "You can make a member read only" and "whether each of them can write or only read"`

Every care team member is read-only, always. There is no per-member permission and no UI to set one. A consent document describing a control the user does not have is the worst place in the app for that error.

**Recommendation.** Rewrite both passages to state plainly that a care team member can read the whole log and cannot change anything. If write access is on the roadmap, the document still has to describe today.

### COPY-3 · The privacy policy still says name and date of birth open a log

**Severity** high  
**Where** `base44/seed/legal-docs.json — privacy: "...which is what someone joining your care team types to confirm they are joining the right person's log"; same claim in pii_sharing`

The join code replaced name-and-DOB precisely because a sister knows both. The policy describes the old, weaker mechanism, which undersells the app's own security and misdescribes what the DOB field is for.

**Recommendation.** Say the invited person enters a six-character code the patient reads out, and that the code is deliberately never sent by email. Keep DOB in the "what it stores" list, but stop calling it the key.

### COPY-4 · The Date of birth field still claims the care team uses it

**Severity** high  
**Where** `src/pages/Me.jsx:80 — hint="your care team confirms this to get in"`

Same stale mechanism, this time on the field itself. It tells the patient a wrong thing about her own data at the moment she is deciding whether to enter it.

**Recommendation.** Replace the hint with what DOB is actually for, or drop the hint. Suggested: "on your PDF, so a clinic can match the record to you".

### COPY-5 · Onboarding step 7 promises permissions you cannot give

**Severity** medium  
**Where** `src/lib/orientation.js — careteam item: "They can view or update your log based on the permissions you give"`

Third instance of the same untruth, and the first one a new patient reads. Someone will add a person expecting to grant read-only and be told they already have.

**Recommendation.** "They can read your whole log. They cannot change anything, and you can remove them at any time."

### COPY-6 · "Red flags say what to do next" — they don't

**Severity** medium  
**Where** `src/pages/Splash.jsx — features list; compare src/components/recovery/RedFlagCheck.jsx placeholder "What happens next"`

The marketing line promises guidance. The screen hands the patient an empty text box and asks her what happens next. The app raises the flag and then has no advice.

**Recommendation.** Either soften the promise ("Red flags watch the log for you and ask what you did about it") or build the guidance (see SAFE-1) and keep the line. Do not ship the promise without the guidance.

### COPY-7 · The permissions doc's "whole list" of local storage is not the whole list

**Severity** low  
**Where** `base44/seed/legal-docs.json — permissions: "remembers two things in your browser"; actual keys: recoverylog.theme, recoverylog.orientation.*, recoverylog.disclaimerSeen, recoverylog.disclaimerNever, recoverylog.pickedPatient, active surgery`

The claim is explicitly exhaustive and is not. Nothing stored is sensitive, which makes this cheap to fix and pointless to leave wrong.

**Recommendation.** List them, or stop counting: "The app remembers a few things in your browser: your appearance choice, which log and surgery you had open, how far you got in the welcome checklist, and whether you have dismissed the notice. Nothing from your log is kept there."

## Names and labels

The same thing called two things, or a thing called by the wrong name. Cheap to fix, and every one of them is a moment where the user stops trusting their own reading.

### NAME-1 · Six places send the user to "Profile"; the tab is called "Setup"

**Severity** high  
**Where** `src/components/recovery/DayView.jsx:213-214, src/components/recovery/DayTotals.jsx ("Set a goal in Profile."), base44/seed/legal-docs.json (three separate pointers)`

There is no Profile tab. A user told to go to Profile has to guess, and the guess is worse than it looks because the settings genuinely are split across two screens (Setup and You).

**Recommendation.** Say "Setup" everywhere, and fix the three legal-doc pointers to their real destinations: care team is on Care, the PDF is in Setup, Delete my account is in You.

### NAME-2 · "Lipidema" is misspelled throughout the splash page

**Severity** medium  
**Where** `src/pages/Splash.jsx — "life with Lipidema", "Built for Lipidema Babes everywhere"`

The condition is lipedema (US) or lipoedema (UK). It is spelled correctly in SurgeryForm's own placeholder ("abdominal liposuction, lipedema"), so the app contradicts itself, and the misspelling is on the one page a stranger reads first.

**Recommendation.** Fix to "lipedema". Keep "Lipedema Babes" — the community voice is doing work and should stay; it just needs the right spelling.

### NAME-3 · The installed app and the website describe two different products

**Severity** medium  
**Where** `index.html and public/manifest.json: "A post-surgery log: what you tracked, day by day, in a form a surgeon can read." vs src/pages/Splash.jsx: "your daily logbook for life with Lipidema"`

The manifest description is what appears when the app is installed and shared. A maintenance user — whom the app explicitly supports — installs something that calls itself a post-surgery log.

**Recommendation.** One sentence that covers both: "A daily log for lipedema: surgery recovery and the long haul, in a form a surgeon can read." Use it in index.html, the manifest, and the splash lede.

### NAME-4 · A maintenance-only user is managed under a heading called "Surgeries"

**Severity** medium  
**Where** `src/components/care/Surgeries.jsx — header "Surgeries", empty state "No surgeries yet. Tap + to add one and your days start counting from its date."`

Maintenance is a first-class mode with its own label everywhere else (ScopeSwitch says "Maintenance", DayHeader says "Maintenance log"), but the place you manage it is named for the other mode.

**Recommendation.** Rename the card "Records" or "Surgeries & logs", and give the empty state a maintenance branch so a non-surgical user is not told their days count from a date they do not have.

### NAME-5 · The History tab's page heading is "Day by day"

**Severity** low  
**Where** `src/components/Layout.jsx:8 vs src/pages/History.jsx:88`

Tapping History lands on a page that calls itself something else. Small, but it is the only tab where the label and the heading disagree.

**Recommendation.** "Day by day" is the better phrase. Either use it in the tab bar too, or make the heading read History.

### NAME-6 · "Red flag" is never defined anywhere in the app

**Severity** low  
**Where** `src/lib/recovery.js:569 RED_FLAG_ITEMS, src/components/recovery/RedFlagCheck.jsx`

It is clinical shorthand presented as if everyone shares it, on the highest-stakes card in the app. A first-time patient meets twelve unexplained phrases and two buttons.

**Recommendation.** One line under the card heading: "Twelve things that most often mean call someone. Answer them once a day." Plus a tap-to-expand explanation per item (see SAFE-4).

## Navigation and structure

Where things live and how you get between them. One of these makes a whole class of day unreachable.

### NAV-1 · A day you logged nothing on cannot be opened, so it cannot be filled in

**Severity** critical  
**Where** `/day/:date is linked from exactly one place — src/pages/History.jsx:107 — and History builds its list from Object.keys(byDate), which is entries grouped by date`

A day with no entries never appears in History, and there is no date picker, calendar, or previous-day control anywhere. Miss a day while you are actually unwell and that day is permanently blank. For a record whose whole purpose is to be complete enough to hand a surgeon, this is the most damaging thing in the review.

**Recommendation.** Add previous/next day arrows to the day header, and a date picker on History that opens any date whether or not it has entries. Either alone fixes it; both is better.

### NAV-2 · The welcome checklist hides Today instead of sitting above it

**Severity** high  
**Where** `src/pages/Home.jsx:89-99 — expanded ? <OrientationChecklist/> : <DayView/>`

It is either/or. A new patient cannot see or use today's log at all until she minimises or dismisses a ten-item checklist. The one thing she came to do is behind the tour.

**Recommendation.** Render the checklist above DayView, not instead of it. Collapse it to a summary row once any entry exists.

### NAV-3 · A day opened from History is a dead end in the installed app

**Severity** high  
**Where** `src/pages/Day.jsx, src/components/Layout.jsx — no back control anywhere`

In a standalone iOS PWA there is no browser chrome and no edge-swipe back. From a past day the only way out is a tab, which drops you on Today rather than back in the list where you were.

**Recommendation.** Add a back control to the day header when the date is not today. "Day by day" with a chevron, returning to History at the scroll position it kept.

### NAV-4 · Delete sits next to Save with no confirmation

**Severity** high  
**Where** `src/components/recovery/EntryForm.jsx (final row) and src/components/recovery/CheckinStack.jsx (same row as Save)`

Three buttons in one row, one of them irreversible, on a form reached by tapping an entry you meant to read. A mis-tap silently destroys a logged entry with no undo.

**Recommendation.** Move Delete out of the primary row — a text button below, or behind the form's own overflow — and make it confirm. Same treatment in the check-in stack.

### NAV-5 · Settings are split across Setup and You with no visible logic

**Severity** medium  
**Where** `src/components/Layout.jsx:12-14 (comment explains the split), src/pages/Profile.jsx, src/pages/Me.jsx`

The rule — the log versus the person — is sound and invisible. "You" is also the only destination not in the tab bar; it is a 32px icon in the header. Appearance, sign-out and account deletion are behind it.

**Recommendation.** Keep the split, but cross-link it: a row at the bottom of Setup reading "Looking for your account, appearance, or the documents you agreed to? → You", and the reverse in You.

### NAV-6 · Care holds three unrelated things

**Severity** medium  
**Where** `src/pages/Care.jsx:304-509 — logs you help with, the care team, and the surgery list`

Two of them are about people and one is about records. A patient with no care team still has to go to Care to add a surgery, which is the app's most structural action sitting under a tab about other people.

**Recommendation.** Move the surgery list to the top of Setup, where the per-surgery tracking settings already live and already need a surgery picker. Care then means people, which is what the word says.

### NAV-7 · History has no way to reach a date that is not on screen

**Severity** medium  
**Where** `src/pages/History.jsx — up to 500 day rows, no search, no filter, no month grouping`

Three months in, finding the day before a follow-up means scrolling. The tab does restore its scroll position, which helps returning and not arriving.

**Recommendation.** Sticky month headers, and a jump-to-date control in the header. A red-flags-only filter would also earn its place — it is the query a patient actually has before an appointment.

### NAV-8 · Trends is two fixed charts with a hardcoded target

**Severity** medium  
**Where** `src/pages/Trends.jsx:104 — "Daily totals vs 100 target", ReferenceLine y={100}`

The reference line ignores the water and protein goals the patient set in Setup, and the heading states a target she never chose. Sleep is computed and never plotted. There is no date range, so the chart compresses as the log grows.

**Recommendation.** Draw the reference lines from the surgery's own goals and name them in the heading. Add a range control (7 / 30 / 90 days / all) and a sleep line.

### NAV-9 · The build stamp is printed on Today

**Severity** low  
**Where** `src/pages/Home.jsx:103-105`

A commit hash and timestamp in mono type at the bottom of the patient's main screen. It is a deploy-verification tool in a place where every pixel is meant for her.

**Recommendation.** Move it to the bottom of You. Keep it select-all so it stays useful for exactly the purpose AGENTS.md describes.

## iOS platform

What the app owes an iPhone specifically: touch targets, type size, install, offline, and what happens when a save fails on bad signal.

### IOS-1 · No save ever reports failure, so a bad-signal save is lost silently

**Severity** critical  
**Where** `src/components/recovery/DayView.jsx saveEntry/deleteEntry, RedFlagCheck.save, QuestionsCard.persist, Profile.patchPatient/patchSurgery, Me.savePatient — no try/catch in any of them; Toaster is mounted in App.jsx but toast() is called only in Register.jsx`

DayView adds the entry optimistically, awaits the write, then reloads. If the write throws — recliner wifi, a dropped connection, the exact conditions this app is used in — the entry appears, the dialog closes, and it vanishes on the reload with no message. The user's own recollection is the only record that it was ever typed.

**Recommendation.** Wrap every write. On failure: keep the dialog open or restore the form, show a toast that says what failed and offer Retry, and leave the optimistic row visibly marked as unsaved. This is the single highest-value fix in the review.

### IOS-2 · The check-in scale's buttons are below the minimum touch target

**Severity** high  
**Where** `src/components/recovery/CheckinStack.jsx:81-95 — eleven flex-1 buttons, h-9 (36px) when unselected`

Eleven segments across a dialog give roughly 40×36pt each, under Apple's 44×44pt minimum, on the control the app asks a patient to use several times a day while medicated and sore. Drag helps; the first tap does not.

**Recommendation.** Give the row a 44pt hit area — keep the bars visually short and extend each button's touch area vertically with padding, or reduce to a 0-10 slider with a 44pt thumb. Same check on the header's 32px You button (src/components/Layout.jsx:70).

### IOS-3 · There is no way to learn that the app can be installed

**Severity** high  
**Where** `public/manifest.json (display: standalone), index.html (apple-mobile-web-app-capable) — and no Add to Home Screen prompt or instructions anywhere`

The whole layout is built for standalone: safe-area insets, a fixed tab bar, a translucent status bar. iOS Safari never offers the install itself, so most users will only ever see the version with a browser bar over the tab bar.

**Recommendation.** A dismissible card on Splash and in the welcome checklist, shown only on iOS Safari and only when not already standalone: "Add LipNode to your home screen — tap Share, then Add to Home Screen."

### IOS-4 · Nine and ten pixel type carries real content, not decoration

**Severity** high  
**Where** `70 instances of text-[9px] / text-[10px] / text-[11px] outside components/ui — including the tracker tile labels (QuickAdd.jsx:32), the tab bar labels (Layout.jsx:125), and whose log you are viewing (Layout.jsx:57-59)`

Apple's floor is 11pt. The tracker tile label is the name of the thing you are about to tap, and the "Viewing" badge is the only thing telling a care team member whose medical record is on screen. Both are at 9px.

**Recommendation.** Lift the floor to 11px, and take the tile labels and the Viewing badge to 12-13px. The tiles are 116×64pt and have the room.

### IOS-5 · Nothing works offline

**Severity** high  
**Where** `No service worker anywhere in the tree; every read goes straight to base44.entities`

A post-surgical patient logs from a recliner, a hospital room, a car. Opening the app without signal shows spinners, and IOS-1 means writes fail quietly. The PWA shell is built and has no offline story behind it.

**Recommendation.** Ship a service worker that caches the app shell so it opens offline, and queue writes for replay. Even shell-only caching plus IOS-1's error handling turns a blank app into an honest one.

### IOS-6 · Rearranging the tracker tiles is undiscoverable

**Severity** medium  
**Where** `src/components/recovery/QuickAdd.jsx:64-65 — 450ms long press or right click, with no hint in the UI`

A considered feature nobody will find. There is no Edit affordance, no first-run hint, and the only documentation is a code comment.

**Recommendation.** A small "Edit" text button beside the "Log an entry" heading that enters the same arrange mode. Keep the long press for people who discover it.

### IOS-7 · A save gives no haptic and no confirmation

**Severity** medium  
**Where** `navigator.vibrate is called once, on entering arrange mode (QuickAdd.jsx:144); no toast on any successful write`

The dialog closes and the entry appears on the timeline, which is decent feedback when you are watching. Tapping through six entries one-handed while sore, you are not watching. The permissions doc even promises "a short buzz when you tap a tracker button", which does not happen.

**Recommendation.** A 10ms vibrate plus a brief toast on each successful save. Then the permissions doc is true, and IOS-1's failure toast has something to be the opposite of.

### IOS-8 · Type size is fixed; there is no way to make the app bigger

**Severity** medium  
**Where** `Sizes are set in px and fixed Tailwind steps throughout; You offers appearance (light/dark/system) only`

Safari does not apply iOS Dynamic Type to a web app, so a patient who has turned system text up gets no benefit here. Post-operative swelling, painkillers and crying all degrade near vision, and this app is used in all three states.

**Recommendation.** Add a text size control beside Appearance that sets a root font-size multiplier, and move the fixed sizes onto rem so it actually takes effect.

### IOS-9 · The numeric keypad has no way to dismiss itself

**Severity** medium  
**Where** `inputMode="numeric" / "decimal" on goal, nutrient, fever and measurement fields — e.g. src/pages/Profile.jsx:374-400`

iOS shows the number pad with no Return key. On a form that is a column of numeric fields, the keyboard covers the bottom of the screen and the only way out is tapping a gap.

**Recommendation.** Wrap the numeric forms so a tap anywhere outside blurs the field, or give the sheet a Done row above the keyboard. Cheapest version: make the form's own background dismiss focus.

### IOS-10 · The manifest locks the app to portrait

**Severity** low  
**Where** `public/manifest.json — "orientation": "portrait"`

iOS ignores it in Safari, so the effect is inconsistent rather than absent, and landscape is the better orientation for typing a long note or reading Trends. Nothing in the layout requires portrait: it is a max-w-lg centred column.

**Recommendation.** Drop the lock, or change to "any". Check Trends and the check-in stack in landscape once, then leave it unlocked.

### IOS-11 · Launching the installed app flashes a blank screen

**Severity** low  
**Where** `No apple-touch-startup-image links in index.html; no 180×180 icon declared`

Standalone iOS apps show a static launch image, and without one you get the background colour and then a cold React boot. The first second of every session is the least finished thing about the app.

**Recommendation.** Add a 180×180 apple-touch-icon and a small set of apple-touch-startup-image links, or a splash that paints the wordmark before React mounts.

### IOS-12 · Pull to refresh has no wording and competes with Safari's own

**Severity** low  
**Where** `src/components/PullToRefresh.jsx — icon rotation only, sr-only text is empty until busy`

A rotating icon with no label, at the same gesture and place iOS uses for its own reload in Safari with chrome showing. A user who does not already know the pattern reads it as a glitch.

**Recommendation.** Show "Pull to refresh" / "Release to refresh" / "Refreshing…" under the icon as the threshold is crossed, and put the same strings in the live region.

## Red flags and safety

The red flag check is the most consequential screen in the app and currently the least designed. Three of these twelve questions are emergency-room questions treated the same as a mild one.

### SAFE-1 · A yes on chest pain gets the same empty text box as a yes on constipation

**Severity** critical  
**Where** `src/components/recovery/RedFlagCheck.jsx:137-163 — every "yes" opens an identical time / called / note block; RED_FLAG_ITEMS includes "Chest pain or short of breath", "Calf pain, swelling, or warmth on one side" and "Confused or hard to wake"`

Those three are the classic presentations of pulmonary embolism, DVT and something systemic — the recognised killers after this surgery. The app's entire response is a note field labelled "What happens next", which asks the patient to supply the medical judgement she opened the app to get help with.

**Recommendation.** Tier the response. On the emergency subset, show a red panel above the note: "This can be an emergency. Call emergency services now — do not wait for the office." On the rest: "Call your surgeon's office." Keep the note field in both cases. Nothing here diagnoses; it routes.

### SAFE-2 · The surgeon's office number is collected and never made callable

**Severity** high  
**Where** `src/components/care/SurgeryForm.jsx (office_phone, labelled "Office phone" next to "Call if fever over °F") — no tel: link anywhere in the app`

The app asks for the number, stores it, prints it in the PDF, and then when a red flag fires and the patient needs it, shows her a toggle that says "Office called" without offering the call. She goes hunting through Care while frightened.

**Recommendation.** Render office_phone as a tel: button on the red flag detail block and on the surgery card. "Call Dr Vega's office" next to "Office called" is the whole fix.

### SAFE-3 · Twelve red flag answers are held in local state behind one Save

**Severity** high  
**Where** `src/components/recovery/RedFlagCheck.jsx — answers/details/sources in useState, persisted only by the single save() at :72`

Answer eight questions, write a note about the one that worries you, get a call, come back, and the app has remounted. Everything unsaved is gone. This is also the card most likely to be interrupted, by definition.

**Recommendation.** Save each answer as it is given, the way the tile trackers already write. Failing that, keep a draft and show an explicit "Not saved yet" state on the card — combined with IOS-1's error handling.

### SAFE-4 · No red flag explains itself

**Severity** medium  
**Where** `src/lib/recovery.js:569-582 — twelve labels, no bodies; src/lib/redFlags.js UNTRACKED_FLAGS is documented in a comment only`

"Urine dropped off or dark all day" and "Redness spreading, or skin hot or hard" both need a threshold to answer honestly, and neither has one. A patient guessing at a red flag either over-reports and stops trusting the card, or under-reports.

**Recommendation.** A tap-to-expand line per item: what to look for, and roughly when it counts. Two or three sentences each, reviewed by whoever owns the clinical content.

### SAFE-5 · Three different fever numbers, one question

**Severity** medium  
**Where** `src/components/care/SurgeryForm.jsx — placeholder "101.5"; src/lib/redFlags.js — FEVER_DEFAULT 100.4; src/lib/recovery.js:570 — "Fever over the surgeon's number"`

The placeholder suggests 101.5, the code falls back to 100.4, and the question implies a number the patient may never have entered. The suggestion mechanism then fires on whichever one happens to apply.

**Recommendation.** Drop the placeholder or set it to the fallback so the two agree, and make the red flag label name the number in force: "Fever over 100.4 °F", drawn from the record. Also expose the field on maintenance records, which currently use the fallback with no way to change it.

### SAFE-6 · Nothing tells the patient she can overrule a suggested flag

**Severity** medium  
**Where** `src/components/recovery/RedFlagCheck.jsx:111-116 — sparkle icon plus the "why" line, no explanation of the mechanism`

The design is careful — it only ever suggests yes, and hers wins the moment she touches it — and none of that reaches the screen. A suggested yes she disagrees with reads as the app telling her she has a problem.

**Recommendation.** One line under the heading: "A sparkle means something you logged looks like a yes. Tap either answer and it becomes yours." Then the two questions nothing can suggest are worth naming too.

## Getting started and joining

First run for a patient, and the join-code handoff for a care team member.

### START-1 · Ten checklist items stand between a new patient and her first entry

**Severity** high  
**Where** `src/lib/orientation.js ORIENTATION_ITEMS — ten items, of which items 2, 3, 4, 5, 6, 9 and 10 all send her to Setup`

Six trips into settings before logging anything. She has just had surgery. She wants to record that she drank 8 oz of water, and the app wants her to configure measurement spots.

**Recommendation.** Cut the blocking list to three: surgery or maintenance, check-in times, log your first entry. Move the other seven into a "Finish setting up" card that stays available and stops being in the way.

### START-2 · Checklist steps ask the user to mark her own homework

**Severity** medium  
**Where** `src/lib/orientation.js — trackers item: "Come back and tick this done once you have."; items are ticked on navigation, not on completion`

Tapping through to Setup marks the step done whether or not anything was changed, and one step asks her to return and tick it manually. The progress count means neither what it says nor anything consistent.

**Recommendation.** Derive each step from state that already exists: a surgery row, a named check-in slot, any entry, any garment. Then the count is true and nobody has to bookkeep.

### START-3 · "I am on someone's care team" is a dead end

**Severity** medium  
**Where** `src/components/ClaimAccess.jsx:168-172 — "Only the patient can add you. Ask them to add {email} to their care team, then sign in again."`

Someone who was told to sign up, and did, before the patient added them, is shown their own email address and told to leave. There is no way to signal that they are waiting, and the only other button on the screen is Sign out.

**Recommendation.** Give the screen a way forward: a copy button on the email address and a share sheet that sends the patient the address plus what to do with it. The account can stay parked; the invitation will find it.

### START-4 · The join code appears once, then hides in an accordion

**Severity** medium  
**Where** `src/pages/Care.jsx:151-176 (shown after the add) and :413-439 (behind tapping the member's row, then inside PendingInvite)`

The patient closes the "Read them this code" panel before making the call, and the code is now three taps deep with nothing on the collapsed row to say it is there. The one thing standing between the invitation and her whole log is the hardest thing on the page to find again.

**Recommendation.** Put the code on the collapsed row for any member who has not opened the log, and label the row "Waiting — code 7K2-QM4". The masking already elsewhere in the app shows the pattern is understood.

### START-5 · A wrong code tells you to ask again, with no way to ask

**Severity** low  
**Where** `src/pages/Care.jsx:49 and src/components/ClaimAccess.jsx:27 — "Ask the patient to read it out again."`

Correct advice, no mechanism, and it does not mention the two things that actually resolve most failures: case does not matter and the dash is optional.

**Recommendation.** "That code doesn't match. Case and the dash don't matter, so check the characters — or ask the patient to read it out again." A "Send them a nudge" button if the invite email can be re-triggered from that side.

## Accessibility

Colour-only meaning, unannounced state changes, and semantics that do not match what the control looks like.

### A11Y-1 · Who raised a red flag is encoded in hue alone

**Severity** high  
**Where** `src/components/recovery/DayTotals.jsx — AUTO #E8590C vs MINE #E01E37, distinguished only by colour; the distinction is in a <title> element`

Orange and red at 20px, side by side, is a distinction a good proportion of users cannot make — and the fallback is a tooltip, which does not exist on touch. "The colour is the whole point", says the comment. That is exactly the problem.

**Recommendation.** Give the two flags different shapes as well as colours, or split the row into "Raised by your entries" and "Raised by you" with the names listed. Both readings then survive any colour vision.

### A11Y-2 · Nothing the app does is announced

**Severity** medium  
**Where** `One aria-live/role=status in the whole tree (src/components/PullToRefresh.jsx:58), and it is empty except while refreshing`

Saving, saved, save failed, red flag count, entry deleted, log switched — a screen reader user gets none of it. For a switch to the other patient's log in particular, silence is a safety issue, not a politeness one.

**Recommendation.** One polite live region in Layout, written to on every save, failure, deletion and log switch. It is a few lines and it carries IOS-1's messages too.

### A11Y-3 · The check-in's level wording is not attached to the control

**Severity** medium  
**Where** `src/components/recovery/CheckinStack.jsx — the face is aria-hidden, field.levels[value] sits in a sibling <p>, and each bar is labelled only "Pain 7"`

The number is announced and the meaning is not. Sighted users get a face, a colour and a sentence; screen reader users get "Pain 7, pressed". The wording is the part that makes the scale answerable.

**Recommendation.** Put the level text in each button's accessible name — aria-label="Pain 7, {levels[7]}" — and make the sentence a live region so dragging announces as it changes.

### A11Y-4 · Identical-looking controls with different semantics, side by side

**Severity** medium  
**Where** `src/pages/Profile.jsx:330-359 — role="switch" and role="checkbox" in the same row, both 56×32, under headers "Track" and "History"`

Visually a pill and a box; semantically two different control types; behaviourally one gates the other (History is disabled unless Track is on) with nothing saying so. The disabled state is opacity-30 with no explanation.

**Recommendation.** Keep the roles, and say the dependency out loud: a hint under the header ("a tracker has to be on to show on the day card") and aria-describedby on the disabled checkbox.

### A11Y-5 · Real content is set in 10px muted grey

**Severity** low  
**Where** `src/components/Field.jsx:10 (field hints), src/pages/History.jsx:114 (which record a day belongs to), src/components/recovery/DayFeed.jsx`

muted-foreground on muted clears 4.5:1, so this passes contrast and still fails legibility: at 10px it reads as chrome, so users skip it — including the hint that explains what a field is for and the label saying which surgery a day belongs to.

**Recommendation.** Anything a user needs in order to answer correctly is not a hint. Take field hints and record labels to 12px and normal foreground, and reserve muted 10px for things that genuinely do not matter.

## Help and FAQ

There is no help surface anywhere in the app. The FAQ content is written and sitting in docs/faq.md; these are about where it goes.

### HELP-1 · There is no help surface anywhere in the app

**Severity** high  
**Where** `No match for faq, help, support or contact in src/ ; the privacy policy's CONTACT is an unfilled placeholder`

No FAQ, no explanation of the join code, no definition of a red flag, and no way to reach a human. Every question a user has, she has to ask the patient — or, if she is the patient, nobody.

**Recommendation.** Add "Help & FAQ" to You, above Privacy and permissions, with the two audience sections from docs/faq.md. Read from a LegalDoc-style seeded record so it can be edited without a deploy.

### HELP-2 · The FAQ should be reachable from the screens that raise the questions

**Severity** medium  
**Where** `src/components/ClaimAccess.jsx (join code), src/pages/Care.jsx Claim (join code), src/components/recovery/RedFlagCheck.jsx (red flags)`

A general help page answers questions people go looking for. The two questions this app actually generates — what is this code, what is a red flag — arrive at a specific moment on a specific screen.

**Recommendation.** A "Why a code?" link on both join-code forms and a "What are red flags?" link on the red flag card, each opening the relevant FAQ section.

### HELP-3 · The FAQ needs a support address that exists

**Severity** medium  
**Where** `docs/faq.md leaves [[CONTACT: support email]]; base44/seed/legal-docs.json leaves the same gap`

Two documents now have a hole the same shape. A health log with no route to a human is a support problem waiting for its first frightened user.

**Recommendation.** Settle one address and fill it in both places at once. It does not have to be staffed around the clock; it has to exist and be stated.
