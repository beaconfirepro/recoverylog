# LipNode FAQ

Content for an in-app help page. Two audiences, kept apart: a patient owns a
log, a care team member reads one. Every answer below describes what the app
does **today**, at the commit this file was written against. Where an answer
depends on something not yet built, it says so rather than promising it.

Suggested placement: **You → Help & FAQ**, with deep links into the two
sections. Link the join-code questions from the join-code screen, and the
red-flag questions from the red flag check.

Tone rules used here: second person, plain words, no hedging, no reassurance
the app cannot deliver. A question is phrased the way someone would actually
ask it, not the way the feature is named.

---

## For patients

### Getting started

**What is LipNode?**
A daily logbook for your own body. You record what goes in, what comes out,
how you feel, what you measure, and what you want to ask your surgeon. The app
totals it up, watches for a short list of warning signs, and turns any stretch
of days into a PDF you can hand over at an appointment.

**Is this my medical record?**
No. Nothing you write here reaches your surgeon, your clinic, or your chart.
Your surgeon sees it only if you show them or hand them the PDF. It is your
own record of your own days.

**Do I need to have had surgery to use it?**
No. Pick a maintenance log instead and your days run by calendar date with no
surgery day to count from. You can add a surgery later and keep the
maintenance log alongside it.

**What is "day zero"?**
The date of your surgery. Once you have entered it, every day is labelled by
its distance from that date, so "Post-op day 9" reads the same to you and to
your surgeon. A maintenance log has no day zero and uses the calendar date.

**Can I track two surgeries at once?**
Yes. Each surgery keeps its own days, its own trackers and its own goals. A
chip row at the top of Today, History and Trends switches between them, or
shows all of them on one timeline.

### Logging your days

**How do I log something?**
Open Today and tap a tile. Each tile opens one short form. The check-in is the
wide button at the top: it asks one measure per screen so a bad morning is
still a handful of taps.

**Can I change which tiles I see?**
Yes. Setup → What to track turns each tracker on or off, per surgery. To
reorder the tiles themselves, press and hold any tile on Today until the grid
goes dashed, then drag them, or use the X to take one off.

**Can I log something for yesterday?**
Open the day from History and log into it there. A day you never touched does
not currently appear in History, so there is no way to open it — if you miss a
day entirely, the day stays empty. *(Known gap. A date picker is the fix.)*

**Can I fix or delete an entry?**
Tap the entry on the day's timeline. The form reopens with what you saved, and
Delete removes it. Deleting is immediate and cannot be undone.

**What does turning a tracker off do to what I already logged?**
Nothing. It hides the tile and stops it appearing on the day card. Everything
already recorded stays, and comes back if you turn the tracker on again.

**Why does the check-in ask at set times?**
Because a score is only comparable to another score taken at the same point in
the day. Setup → Check-in is where you name the times; the form pre-selects
whichever one has most recently passed.

**What are goals for?**
A goal turns a number into a fraction. "46 oz" tells you less than "46 of 64
oz", so a tracker with a goal gets a bar on Day totals. Leave a goal blank and
that tracker just reports the number. Goals are set per surgery in Setup.

### Red flags

**What is the red flag check?**
Twelve questions about the things that most often mean "call someone" after
surgery. You answer them once a day. Your answers, the time, whether you called,
and what you did about it all land in the PDF.

**Why is a question already answered when I open it?**
Because something you logged that day looks like a yes. A question answered
that way is marked with a sparkle and a line saying which entry it came from.
It is a suggestion, not a verdict — tap either answer and it becomes yours.
The app only ever suggests "yes"; it never answers "no" for you.

**What should I do if I answer yes?**
Use your surgeon's instructions first — they know your operation. As a general
rule: **if you cannot breathe, have chest pain, are confused or cannot be
woken, that is emergency services, not the office.** For anything else, call
the number on your discharge papers. Write down in the app what you did, so
the next person who reads the log knows.

**Does the app call anyone for me?**
No. It never contacts your surgeon, your clinic, or emergency services. It
records what you decided.

**What fever number does it use?**
Whatever you put in your surgery's "Call if fever over" field. If you leave it
blank the app falls back to 100.4 °F, which is a general threshold and not your
surgeon's. Enter the number they gave you.

### Your care team

**Who can see my log?**
You, and only the people you add yourself. Nobody else.

**How do I add someone?**
Care → Care team → **+**. Enter their email and name. They get an invitation
email, and you get a six-character code.

**Why is the code not in the email?**
Because the email alone would be enough to open your log. Having their address
is what identifies them; the code is what proves you meant them. If both
travelled in one message, one mistyped address would hand over everything. Read
the code out, text it, or write it down.

**Where do I find the code again?**
Care → Care team, tap that person's row. The code stays there until they use
it. You can also send the invitation email again from the same place.

**What can a care team member do?**
Read. All of it — every entry, every day, every red flag, your measurements and
your photos. They cannot add, edit or delete anything, and they cannot add
other people.

**Can I give someone write access?**
Not today. Every care team member is read-only.

**How do I remove someone?**
Care → Care team, tap their row, Remove. Their access ends immediately. You can
add them again later, which issues a new code.

**They say the code doesn't work.**
Codes are not case-sensitive and the dash is optional, so `7k2qm4` and `7K2-QM4`
are the same code. If it still fails, remove them and add them again — an
invitation created before codes existed has none and cannot be opened.

### Sharing and export

**How do I show my surgeon?**
Setup → Download a PDF. Pick a day or a range, and it builds on your phone. It
carries the surgery details, your goals, the care team, garments, med groups,
trends, red flags and your questions.

**Where does the PDF go?**
Wherever you send it. Once it leaves the app it is an ordinary file and the app
has no say in where it ends up.

**Why is there a limit on the date range?**
Because past a point the PDF would have to drop days to fit, and a record meant
for a surgeon that silently misses days is worse than one you have to build in
two halves.

### Your account

**Can I use this on more than one device?**
Yes. Your log lives on your account, so signing in anywhere shows the same
days. Your appearance choice and the tile order are per device.

**Can I install it like an app?**
On iPhone: open it in Safari, tap the Share button, then **Add to Home
Screen**. It then opens full-screen with no browser bar. Safari never offers
this by itself, so you have to go and get it.

**Does it work without signal?**
Not reliably. Entries save to your account as you make them, so a drop-out can
lose whatever you were saving. If you are somewhere with bad signal, check the
entry appeared on the timeline before moving on.

**How do I delete everything?**
You → Delete my account. It asks you to type your email address, then removes
your login and the whole log: every entry, every day, every surgery, your
measurements, garments, med groups and your care team's access. Permanent, no
undo.

**Who do I contact about a problem?**
[[CONTACT: support email]] *(placeholder — the privacy policy carries the same
gap and both need filling before launch.)*

---

## For care team members

### Getting in

**Someone added me. What do I do?**
Create an account with the email address they used, sign in, and enter the
six-character code they read out to you. That opens their log.

**Why do I need a code as well as the email?**
The email tells you the log exists. The code proves the patient meant you. The
code is deliberately never sent by email, so an invitation that reaches the
wrong inbox still opens nothing.

**Where do I get the code?**
From the patient, out loud or by text. Not from the app, not from the email,
and nobody else can look it up for you.

**The code isn't working.**
Case and the dash don't matter. If it still fails, ask them to check the code
on their Care page — and if the row shows no code at all, ask them to remove
you and add you again.

**I signed in and it says I'm not on a log.**
Nobody has added you yet, or they used a different email address. Only the
patient can add you; there is no way to request access from inside the app. Ask
them to add the exact address you signed in with.

**Can I be on more than one person's care team?**
Yes. You → Logs you help with lists every one you have opened. One is open at
a time, and the top of the screen always names whose log you are reading.

### What you can do

**What can I see?**
Everything in that patient's log: every entry, the timeline, day totals, the
red flag check and what they wrote about it, their questions for the surgeon,
their measurements, and any photos they attached.

**Can I add or change anything?**
No. Every care team member is read-only. You cannot log an entry, answer a red
flag, or edit anything the patient wrote.

**Can I log on their behalf when they're asleep?**
Not in the app. Write it down and have them enter it, or have them hand you
their own signed-in phone.

**Can I add other people to the team?**
No. Only the patient can.

**Can I export the PDF?**
Yes, from Setup, for the log you have open. Treat it as their health
information: it is theirs, not yours, and where it goes after you export it is
on you.

### Reading a log well

**Where should I start?**
Today, then Day totals, then the red flag check. Totals say whether the day
went the way it should; the red flag check says whether anything needs a phone
call.

**What do the flag colours mean?**
On Day totals, an orange flag was raised by the patient's own entries; a red
flag was raised by the patient answering the question herself. Both count.

**What does "Post-op day 9" mean?**
Nine days since the surgery date on that record. A maintenance log has no
surgery date and shows the calendar date instead.

**Their log looks worrying. What do I do?**
Talk to them, and get them to call their surgeon's office — the number is on
the surgery record in Care. If it looks like an emergency, call emergency
services. The app notifies nobody; if you saw it, you are the notification.

### Your account

**Am I in their log as a person?**
Yes. Your name and email are on their care team list, along with whether you
have opened it. They can remove you at any time, which ends your access
immediately.

**How do I step away?**
You → Logs you help with → Leave this care team. That ends your access to that
log. It does not touch anything the patient recorded, and they can add you
again later.

**What happens if I delete my account?**
Your login goes, and you come off every care team you are on. The patients'
logs are untouched.
