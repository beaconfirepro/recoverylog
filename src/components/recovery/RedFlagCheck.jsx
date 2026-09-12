import React, { useState } from "react";
import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { RED_FLAG_ITEMS } from "@/lib/recovery";
import { nowTime } from "@/lib/dates";
import { base44 } from "@/api/base44Client";
import { isMaintenance } from "@/lib/scope";
import TimeInput from "@/components/recovery/TimeInput";

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
  const [saving, setSaving] = useState(false);

  // Maintenance has no surgeon's office to ring, so the toggle reads as the
  // generic "I contacted my doctor" rather than a phone that does not exist.
  const calledLabel = isMaintenance(record) ? "Doctor called" : "Office called";

  const answered = Object.keys(answers).length;
  const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");

  const setAns = (key, v) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    setSources((s) => ({ ...s, [key]: "user" }));
    if (v === "no") {
      setDetails((d) => {
        const n = { ...d };
        delete n[key];
        return n;
      });
    } else {
      setDetails((d) => ({
        ...d,
        [key]: { time: d[key]?.time || nowTime(), office_called: d[key]?.office_called || false, note: d[key]?.note || "" }
      }));
    }
  };

  const patch = (key, fields) => setDetails((d) => ({ ...d, [key]: { ...d[key], ...fields } }));

  const save = async () => {
    setSaving(true);
    await base44.entities.RecoveryDay.update(day.id, {
      red_flag_answers: answers,
      red_flag_details: details,
      red_flag_sources: sources,
      red_flag_completed: answered === RED_FLAG_ITEMS.length
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="nb-card p-4" style={yesKeys.length > 0 ? { borderColor: "hsl(var(--destructive))", borderWidth: 3 } : {}}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-sm uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-destructive" /> Red flag check
        </h2>
        <span className="text-xs font-bold text-muted-foreground">
          {answered}/{RED_FLAG_ITEMS.length} answered
          {day.red_flag_completed && answered === RED_FLAG_ITEMS.length && (
            <Check className="inline w-3.5 h-3.5 ml-1 text-green-600" />
          )}
        </span>
      </div>

      <div className="space-y-3 mt-2">
        {RED_FLAG_ITEMS.map((item) => {
          const ans = answers[item.key];
          const det = details[item.key];
          // Marked as read off the day only while she has not answered it herself.
          const hint = sources[item.key] === "auto" ? suggestions[item.key]?.why : null;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold break-words ${ans === "yes" ? "text-destructive" : ""}`}>
                    {item.label}
                  </span>
                  {hint && (
                    <span className="flex items-start gap-1 text-xs font-semibold text-muted-foreground break-words">
                      <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                      {hint}
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
              {ans === "yes" && (
                <div className="mt-1.5 pl-2 space-y-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <TimeInput
                      small
                      value={det?.time || ""}
                      onChange={(t) => patch(item.key, { time: t })}
                    />
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
                    onChange={(e) => patch(item.key, { note: e.target.value })}
                    placeholder="What happens next"
                    readOnly={!canWrite}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canWrite && (
        <button className="nb-btn w-full h-14 bg-primary text-primary-foreground mt-4" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save red flag check"}
        </button>
      )}
    </div>
  );
}