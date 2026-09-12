# Red flag explanations — draft for clinical review

> **This is a draft. It has not been reviewed by a clinician and must not ship
> until it has been.** The twelve red flags are the surgeons' list. These
> explanations are written from published patient-facing guidance (sources at the
> end), not from the surgeons who gave you the list, and they may not match what
> those surgeons meant by each line. Every threshold below is the one general
> guidance uses; a surgeon's own number for their own patient wins.

Content for issue #105. Intended as the `body` of each entry in
`RED_FLAG_ITEMS` (`src/lib/recovery.js:569`), shown behind a tap-to-expand on
the red flag card using the question-mark-and-tooltip pattern settled in #118.

## Rules these were written to

1. **Describe, don't diagnose.** Each one says what to look for, not what it
   means. "One calf is bigger than the other" is something a patient can check.
   "You may have a DVT" is not hers to conclude and not the app's to say.
2. **Give a threshold where one honestly exists**, and say plainly when one does
   not. "Redness spreading" needs a yardstick — past the incision edge, bigger
   than yesterday — or she is guessing.
3. **Her surgeon's instructions outrank this.** Said once on the card rather
   than twelve times, but never contradicted.
4. **No reassurance.** Not "this is usually nothing". Some of these are usually
   nothing and it is not the app's place to sort which, because the sorting is
   the reason to call.
5. **Short.** Two or three sentences. This is read one-handed, sore, possibly at
   3am.
6. **Say what the app will do, and that she can overrule it.** Not "can raise" —
   it will, every time the condition matches, and a patient who reads that as a
   maybe has been told something false about her own screen. Always paired with
   the override, because a flag the app raised and she disagrees with otherwise
   reads as the app telling her she has a problem. Same wording the card uses.
7. **Say when the app cannot see it.** Two of the twelve can never be raised
   automatically, and that is worth her knowing.

---

## The twelve

### 1. Fever over your surgeon's number

**Look for:** A temperature at or above the baseline set in Setup, taken when
you have not just had a hot drink or a hot shower. Put your surgeon's number in
that field.

**When it counts:** One reading at or over the baseline is enough to call. A
low-grade rise in the first day or two is common; a fever that arrives later, or
climbs, is the one that matters.

**The app will raise this for you** when a temperature you log comes in over the
baseline set in Setup. You can override it.

---

### 2. Calf pain, swelling, or warmth on one side

**Look for:** One calf that is bigger, tighter, warmer, or sorer than the other.
Compare them — the point is the difference between your two legs, not how either
one feels on its own. It may hurt only when you stand or walk.

**When it counts:** Any clear difference between one side and the other. Both
legs swelling after surgery is expected. One leg is not.

**The app will raise this for you** when you mark a calf on the body map. You
can override it.

---

### 3. Chest pain or short of breath

**Look for:** Pain in your chest, being out of breath doing something that did
not make you out of breath yesterday, a racing heart, or coughing up blood.

**When it counts:** Straight away, at any point in your recovery — not only in
the first week. This is the one on the list that does not wait for the office to
open.

**The app cannot see this.** No tracker measures your breathing, so this is
always yours to answer.

---

### 4. Redness spreading, or skin hot or hard

**Look for:** Redness that reaches past the edge of the incision and onto
ordinary skin, or an area that is hot to the touch, or hard rather than puffy.
Photograph it — the useful question is whether it is bigger than yesterday, and
a photo answers that better than memory.

**When it counts:** When it is spreading, not when it is merely present. A thin
pink line along a closed incision is expected. Redness marching outward, or
skin that is hot and firm, is not.

**The app will raise this for you** from your incision entries. You can
override it.

---

### 5. Drainage foul or pus-like

**Look for:** Fluid that smells bad, or that has gone from thin and pink-tinged
to thick, cloudy, yellow, green or grey.

**When it counts:** Smell alone is enough. Thin pink or straw-coloured fluid,
sometimes a lot of it, is normal after this surgery. Cloudy, thick or smelly
is not, however small the amount.

**The app will raise this for you** from your drainage and incision entries.
You can override it.

---

### 6. Bright red bleeding restarted after slowing

**Look for:** Fresh bright red blood soaking a dressing after the bleeding had
already settled down.

**When it counts:** When it restarts, or when it soaks through a dressing faster
than you can change it. Old blood is dark and expected. Bright red and new,
after things had calmed, is the change worth a phone call.

**The app will raise this for you** from your drainage entries. You can
override it.

---

### 7. Dizzy on standing

**Look for:** The room going grey or swimmy when you stand up, needing to hold
on to something, or nearly fainting.

**When it counts:** When it keeps happening, or when it is bad enough that you
have to sit back down. A moment of light-headedness standing up on day one is
common. Every time you stand, on day five, is not.

**The app will raise this for you** when you log feeling dizzy during movement.
You can override it.

---

### 8. Urine dropped off or dark all day

**Look for:** Going much less often than usual despite drinking, or urine that
stays dark — tea-coloured, brown, or pink — across a whole day rather than just
first thing.

**When it counts:** When drinking more does not clear it by the end of the day.
Concentrated first-morning urine is ordinary. All day, or brown or pink at any
point, is not.

**The app will raise this for you** from your urine entries. You can override
it.

---

### 9. Pain suddenly worse, not better

**Look for:** Pain that jumps up instead of easing off, pain in one specific
spot that is much worse than everywhere else, or pain your medication stops
touching when it was working before.

**When it counts:** When the direction changes. Recovery pain trends downward
with bad days in it. A step up, especially in one place, is different from a bad
day.

**The app will raise this for you** when a check-in puts pain at 8 or above.
You can override it.

---

### 10. No bowel movement for 3 or more days

**Look for:** Three full days with nothing, counting from the last one and not
from surgery.

**When it counts:** At three days. Pain medication slows everything down and
this is expected enough that the plan is usually made in advance — but it is on
the list because it stops being a nuisance and becomes a problem if it is left.
Call sooner if you also have a swollen belly, cramping, or you are being sick.

**The app will raise this for you** by counting the days since your last logged
bowel movement. You can override it.

---

### 11. Numbness or colour change under your garment

**Look for:** Skin past the edge of the garment — fingers, toes, ankles — that
has gone numb, pale, blue, or cold. Pins and needles that do not settle when you
move. A garment that has rolled, bunched, or dug in.

**When it counts:** When the numbness or the colour does not come back within a
few minutes of loosening the garment. Compression is meant to be firm, and
patchy numbness over an area that was operated on is expected as nerves recover.
A cold or colourless hand or foot is not.

**The app will raise this for you** when you log numbness or a pale, cold area
on the skin map. You can override it.

---

### 12. Confused or hard to wake

**Look for:** Someone who is muddled about where they are or what day it is,
slurring, unusually sleepy, or hard to rouse. This is the one on the list that
somebody else usually notices first.

**When it counts:** Straight away. Being tired and foggy on pain medication is
expected; not making sense, or not waking properly, is not.

**The app cannot see this.** No tracker measures how awake you are, so this is
always yours to answer — and it is worth telling whoever is looking after you
that it is on the list.

---

## Two things to settle before this ships

1. **Items 3 and 12 are the emergency pair.** #102 puts one standing disclaimer
   at the bottom of the card rather than tiering each item, which is the decision
   made — so the disclaimer has to carry the "do not wait for the office" weight
   for these two. Worth checking the disclaimer wording against these two
   explanations so they say the same thing.
2. ~~**Item 1 names 101.5 °F.**~~ **Settled.** The explanation points at the
   baseline in Setup and names no number at all, so it stays a fixed string like
   the other eleven and cannot go stale against a patient who set her own. The
   number still appears where it is actionable — the red flag question itself
   reads it off the record through `flagLabel` (#106), so she always knows what
   she is answering against.

## Sources

General patient-facing guidance, used for thresholds and for what to look for.
None of these is specific to lipedema liposuction, which is the gap a clinician
needs to close.

- [Signs of an infection after surgery — Cleveland Clinic](https://health.clevelandclinic.org/what-to-know-about-infections-after-surgery) — fever over 101 °F, redness beyond the incision, discharge, odor
- [Surgical site infections — Johns Hopkins Medicine](https://www.hopkinsmedicine.org/health/conditions-and-diseases/surgical-site-infections) — redness, delayed healing, fever, tenderness, warmth, swelling
- [Surgical site infection basics — CDC](https://www.cdc.gov/surgical-site-infections/about/index.html)
- [Deep vein thrombosis — Cleveland Clinic](https://my.clevelandclinic.org/health/diseases/16911-deep-vein-thrombosis-dvt) — one-sided swelling, pain on standing or walking, warmth; most DVTs are in the calf, thigh or pelvis
- [Avoiding unfavourable outcomes in liposuction — PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3901920/) — complication range from seroma to venous thromboembolism and fat embolism
- [Unfavourable outcomes of liposuction and their management — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3901919/)
- [Early postoperative pulmonary fat embolism following cosmetic liposuction — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13227903/) — sudden shortness of breath, chest pain, tachycardia, haemoptysis; early symptoms can mimic benign post-operative responses
- [Late-onset pneumothorax and bilateral pulmonary embolism following combined liposuction and mastopexy — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12284388/) — why vigilance has to extend well past the first week
- [Severe postoperative bleeding following abdominal and flank liposuction — PMC](https://ncbi.nlm.nih.gov/pmc/articles/PMC8826114)
- [Compression garments in recovery — American Society of Plastic Surgeons](https://www.plasticsurgery.org/news/articles/keep-it-snatched-why-compression-garments-are-your-best-friends-in-recovery) — compressive but never cutting off circulation
- [Rhabdomyolysis — StatPearls, NCBI](https://pmc.ncbi.nlm.nih.gov/articles/PMC8085791/) — the myalgia, weakness and tea-coloured urine triad
