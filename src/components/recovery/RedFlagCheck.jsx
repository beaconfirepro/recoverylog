import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Phone, Sparkles } from "lucide-react";
import { RED_FLAG_DISCLAIMER, RED_FLAG_ITEMS, RED_FLAG_SOURCES, flagLabel } from "@/lib/recovery";
import { nowTime } from "@/lib/dates";
import { base44 } from "@/api/base44Client";
import { isMaintenance } from "@/lib/scope";
import { telHref } from "@/lib/phone";
import TimeInput from "@/components/recovery/TimeInput";
import HelpHint from "@/components/help/HelpHint";

// How long a note sits unsent before it is written. Long enough that typing a
// sentence is one write rather than forty, short enough that putting the phone
// down mid-sentence still saves it.
const NOTE_DEBOUNCE_MS = 900;

export default function RedFlagCheck({ day, suggestions = {}, onSaved, canWrite = true, record = null }) {
  // A suggestion fills a question she has not answered herself. Once she
  // answers one, hers is the answer: the day's entries never overwrite it.
  const [answers, setAnswers] = useState(() => {
    const saved = day.red_flag_answers || {};
    const merged = { ...saved };
    Object.entries(suggestions).forEach(([k, v]) => {
      if (merged[k] === undefined) merged[k] = v.answer;
    });
    return merged;
  });
  // A suggested yes needs somewhere to write the next action, so its detail
  // block exists from the moment the suggestion lands rather than only when she
  // taps Yes herself.
  const [details, setDetails] = useState(() => {
    const saved = day.red_flag_details || {};
    const merged = { ...saved };
    Object.entries(suggestions).forEach(([k, v]) => {
      if (v.answer === "yes" && (day.red_flag_answers || {})[k] === undefined && !merged[k]) {
        merged[k] = { time: nowTime(), office_called: false, note: "" };
      }
    });
    return merged;
  });
  // Where each answer came from. A suggestion she leaves standing is the day's
  // own entries speaking; the moment she touches a question it becomes hers,
  // whichever way she answers it.
  const [sources, setSources] = useState(() => {
    const saved = day.red_flag_sources || {};
    const merged = { ...saved };
    Object.keys(suggestions).forEach((k) => {
      if ((day.red_flag_answers || {})[k] === undefined) merged[k] = "auto";
    });
    return merged;
  });
  // "saving" | "saved" | "failed". This card used to hold twelve answers behind
  // one button, so a phone call in the middle of it lost the lot. Now each
  // answer is written as it is given and this says where that write got to.
  const [state, setState] = useState(null);

  // Maintenance has no surgeon's office to ring, so the toggle reads as the
  // generic "I contacted my doctor" rather than a phone that does not exist.
  const maintenance = isMaintenance(record);
  const calledLabel = maintenance ? "Doctor called" : "Office called";
  const office = telHref(record?.office_phone);

  const answered = Object.keys(answers).length;

  // Written straight from the values being set rather than read back out of
  // state, because state has not caught up at the point the tap happens.
  const persist = useCallback(
    async (nextAnswers, nextDetails, nextSources) => {
      // A care team member reads this card, and on a day the patient never
      // touched the row she is reading does not exist — DayView hands over an
      // unsaved stand-in with no id. The buttons are disabled for her, but the
      // time picker is not, so this is the guard that actually holds.
      if (!canWrite || !day.id) return;
      setState("saving");
      try {
        await base44.entities.RecoveryDay.update(day.id, {
          red_flag_answers: nextAnswers,
          red_flag_details: nextDetails,
          red_flag_sources: nextSources,
          red_flag_completed: Object.keys(nextAnswers).length === RED_FLAG_ITEMS.length
        });
        setState("saved");
      } catch {
        // Deliberately not reloading the day on failure: what she typed is
        // still on screen and still in state, and a reload would replace it
        // with the copy that never got written.
        setState("failed");
      }
    },
    [day.id, canWrite]
  );

  // The note is the one field that types rather than taps, so it is the one
  // field that cannot be written on every change.
  const noteTimer = useRef(null);
  const pending = useRef(null);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  const flush = useCallback(() => {
    clearTimeout(noteTimer.current);
    if (!pending.current) return;
    const { a, d, s } = pending.current;
    pending.current = null;
    persist(a, d, s);
  }, [persist]);

  // A note half-typed when the app goes to the background is a note she thinks
  // she wrote down.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  const setAns = (key, v) => {
    const nextAnswers = { ...answers, [key]: v };
    const nextSources = { ...sources, [key]: "user" };
    let nextDetails;
    if (v === "no") {
      nextDetails = { ...details };
      delete nextDetails[key];
    } else {
      nextDetails = {
        ...details,
        [key]: {
          time: details[key]?.time || nowTime(),
          office_called: details[key]?.office_called || false,
          note: details[key]?.note || ""
        }
      };
    }
    setAnswers(nextAnswers);
    setSources(nextSources);
    setDetails(nextDetails);
    flush();
    persist(nextAnswers, nextDetails, nextSources);
  };

  const patch = (key, fields, { debounce = false } = {}) => {
    const nextDetails = { ...details, [key]: { ...details[key], ...fields } };
    setDetails(nextDetails);
    if (!debounce) {
      flush();
      persist(answers, nextDetails, sources);
      return;
    }
    pending.current = { a: answers, d: nextDetails, s: sources };
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(flush, NOTE_DEBOUNCE_MS);
  };

  // One explanation open at a time. Twelve of these expanded is a page nobody
  // scrolls, and the question she opened one to answer is about one flag.
  const [open, setOpen] = useState(null);

  const yesCount = Object.keys(answers).filter((k) => answers[k] === "yes").length;

  return (
    <div className="nb-card p-4" data-gtour="redflags-card" style={yesCount > 0 ? { borderColor: "hsl(var(--destructive))", borderWidth: 3 } : {}}>
      <div className="flex items-center justify-between mb-1 gap-2">
        <h2 className="font-heading text-sm uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-destructive" /> Red flag check
          <HelpHint label="Red flags">
            <p>
              Twelve things that most often mean call someone after this surgery. Your surgeons gave the list.
            </p>
            <p>
              Answer them once a day. A sparkle means something you logged looks like a yes — tap either answer
              to override it. The app only ever suggests yes, so it can never talk you out of a flag.
            </p>
          </HelpHint>
        </h2>
        <span className="text-xs font-bold text-muted-foreground shrink-0">
          {answered}/{RED_FLAG_ITEMS.length} answered
          {day.red_flag_completed && answered === RED_FLAG_ITEMS.length && (
            <Check className="inline w-3.5 h-3.5 ml-1 text-green-600" />
          )}
        </span>
      </div>

      {/* Twelve clinical phrases and two buttons, with nothing saying what they
          are for, is a card a first-time patient cannot answer honestly. */}
      <p className="text-xs font-semibold text-muted-foreground break-words">
        Twelve things that most often mean call someone. Answer them once a day. Tap any one to read what it
        means.
      </p>

      {canWrite && (
        <p className="mt-1 text-xs font-semibold text-muted-foreground break-words">
          Answers save as you tap them. If something changes later, answer again — the newest answer is the one
          that counts, and the earlier one is not kept.
        </p>
      )}

      {/* The mechanism was careful and invisible: only "yes" is ever suggested,
          so the app can never talk her out of a flag, and hers wins the moment
          she touches the question. Said out loud, a suggested yes reads as a
          suggestion rather than as a diagnosis. */}
      {Object.keys(suggestions).length > 0 && (
        <p className="mt-1 text-xs font-semibold text-muted-foreground break-words">
          A sparkle means something you logged looks like a yes. Tap either answer to override it.
        </p>
      )}

      <div className="space-y-3 mt-3">
        {RED_FLAG_ITEMS.map((item) => {
          const ans = answers[item.key];
          const det = details[item.key];
          // Marked as read off the day only while she has not answered it herself.
          const hint = sources[item.key] === "auto" ? suggestions[item.key]?.why : null;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  {/* The label is the control. A question mark beside all
                      twelve reads as twelve small glyphs down one column, and
                      the thing she wants to tap is the phrase she does not
                      understand — so that is what opens it. The chevron rides
                      inside the label rather than sitting in its own column,
                      because a label that looks like text and behaves like a
                      button is a control nobody finds. */}
                  <button
                    type="button"
                    className="flex items-start gap-1 text-left min-h-11 py-1 w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-expanded={open === item.key}
                    aria-controls={`flag-body-${item.key}`}
                    onClick={() => setOpen(open === item.key ? null : item.key)}
                  >
                    <span className={`block text-sm font-semibold break-words ${ans === "yes" ? "text-destructive" : ""}`}>
                      {flagLabel(item, record)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 mt-0.5 shrink-0 text-muted-foreground transition-transform ${open === item.key ? "rotate-180" : ""}`}
                    />
                  </button>
                  {hint && (
                    <span className="flex items-start gap-1 text-xs font-semibold text-muted-foreground break-words">
                      <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                      {hint} · Tap to override recommendation
                    </span>
                  )}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    className="nb-chip h-9 text-xs"
                    style={ans === "no" ? { backgroundColor: "#06D6A0" } : {}}
                    onClick={() => setAns(item.key, "no")}
                    disabled={!canWrite}
                  >
                    No
                  </button>
                  <button
                    className="nb-chip h-9 text-xs"
                    style={ans === "yes" ? { backgroundColor: "hsl(var(--destructive))", color: "#fff" } : {}}
                    onClick={() => setAns(item.key, "yes")}
                    disabled={!canWrite}
                  >
                    Yes
                  </button>
                </div>
              </div>
              {/* Three parts: what it looks like, when it is worth a call, and
                  what the app does about it. The third says itself whether the
                  app can see this one at all, so it is not labelled — two of
                  the twelve nothing tracks, and that is worth her knowing. */}
              <div id={`flag-body-${item.key}`} hidden={open !== item.key}>
                <div className="mt-1.5 mb-1 pl-2 border-l-2 space-y-1.5" style={{ borderColor: "hsl(var(--muted-foreground))" }}>
                  <p className="text-xs font-semibold break-words">
                    <span className="text-muted-foreground">Look for: </span>
                    {item.body[0]}
                  </p>
                  <p className="text-xs font-semibold break-words">
                    <span className="text-muted-foreground">When it counts: </span>
                    {item.body[1]}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground break-words">{item.body[2]}</p>
                </div>
              </div>

              {ans === "yes" && (
                <div className="mt-1.5 pl-2 space-y-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <TimeInput
                      small
                      value={det?.time || ""}
                      onChange={(t) => patch(item.key, { time: t })}
                    />
                    {/* The number was collected, stored and printed in the PDF,
                        and then when a flag fired she was shown a toggle saying
                        "Office called" with no way to call. */}
                    {office && (
                      <a
                        href={office}
                        className="nb-chip h-9 text-xs gap-1.5"
                        style={{ backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        Call the office
                      </a>
                    )}
                    <button
                      className="nb-chip h-9 text-xs"
                      style={det?.office_called ? { backgroundColor: "hsl(var(--secondary))", color: "#fff" } : {}}
                      onClick={() => patch(item.key, { office_called: !det?.office_called })}
                      disabled={!canWrite}
                    >
                      {calledLabel}
                    </button>
                  </div>
                  {/* A flag with no next action is a worry written down. This is
                      where what happens about it goes. */}
                  <textarea
                    className="nb-textarea min-h-[3.5rem]"
                    value={det?.note || ""}
                    onChange={(e) => patch(item.key, { note: e.target.value }, { debounce: true })}
                    onBlur={flush}
                    placeholder="What happens next"
                    readOnly={!canWrite}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Always on screen, not only after a yes: it is no use to her the first
          time she reads it if that is the moment she needed it. The surgeons
          gave this list as "if any of these happen, call", so the card says so
          rather than tiering twelve questions the surgeons did not tier. */}
      <div
        className="mt-4 border-2 rounded-xl p-3 space-y-1.5"
        style={{ borderColor: "hsl(var(--destructive))" }}
      >
        <p className="text-sm font-bold break-words" style={{ color: "hsl(var(--destructive))" }}>
          These are common red flag items. Be sure to verify with your surgeon or providers what
          constitutes emergency or urgent in your situation. The below is no substitute for medical
          advice.
        </p>
        <p className="text-sm font-semibold break-words">
          If you cannot breathe, have chest pain, are confused or cannot be woken, call emergency services. Do
          not wait for the office.
        </p>
        {office && (
          <a
            href={office}
            className="nb-btn w-full h-12 mt-1 flex items-center justify-center gap-2 bg-card"
          >
            <Phone className="w-4 h-4 shrink-0" />
            Call {maintenance ? "your doctor" : "the office"}
          </a>
        )}
        {!office && (
          <p className="text-xs font-semibold text-muted-foreground break-words">
            No phone number on this record yet. Add one on the surgery so it is here when you need it.
          </p>
        )}

        {/* The twelve flags are the surgeons' list. The explanations behind
            them are not, and she is entitled to know which before she acts on
            one — so it is said here, under the standing warning, rather than
            inside twelve separate expanders where it would read as fine print
            twelve times. */}
        <p className="pt-1 text-xs font-semibold text-muted-foreground break-words">
          {RED_FLAG_SOURCES} {RED_FLAG_DISCLAIMER}
        </p>
      </div>

      {canWrite && state && (
        <p
          className="mt-2 text-xs font-bold break-words"
          role="status"
          style={state === "failed" ? { color: "hsl(var(--destructive))" } : undefined}
        >
          {state === "saving" && "Saving…"}
          {state === "saved" && "Saved ✔"}
          {state === "failed" &&
            "That did not save. Your answers are still here — check your connection and tap the answer again."}
        </p>
      )}
    </div>
  );
}