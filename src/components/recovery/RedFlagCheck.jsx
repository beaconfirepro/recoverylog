import React, { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { RED_FLAG_ITEMS } from "@/lib/recovery";
import { nowTime } from "@/lib/dates";
import { base44 } from "@/api/base44Client";

export default function RedFlagCheck({ day, onSaved }) {
  const [answers, setAnswers] = useState(day.red_flag_answers || {});
  const [details, setDetails] = useState(day.red_flag_details || {});
  const [saving, setSaving] = useState(false);

  const answered = Object.keys(answers).length;
  const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");

  const setAns = (key, v) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    if (v === "no") {
      setDetails((d) => {
        const n = { ...d };
        delete n[key];
        return n;
      });
    } else {
      setDetails((d) => ({ ...d, [key]: { time: d[key]?.time || nowTime(), office_called: d[key]?.office_called || false } }));
    }
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.RecoveryDay.update(day.id, {
      red_flag_answers: answers,
      red_flag_details: details,
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
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold min-w-0 break-words ${ans === "yes" ? "text-destructive" : ""}`}>{item.label}</span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    className="nb-chip h-9 text-xs"
                    style={ans === "no" ? { backgroundColor: "#06D6A0" } : {}}
                    onClick={() => setAns(item.key, "no")}
                  >
                    No
                  </button>
                  <button
                    className="nb-chip h-9 text-xs"
                    style={ans === "yes" ? { backgroundColor: "hsl(var(--destructive))", color: "#fff" } : {}}
                    onClick={() => setAns(item.key, "yes")}
                  >
                    Yes
                  </button>
                </div>
              </div>
              {ans === "yes" && (
                <div className="flex items-center gap-2 mt-1.5 pl-2">
                  <input
                    type="time"
                    value={det?.time || ""}
                    onChange={(e) => setDetails((d) => ({ ...d, [item.key]: { ...d[item.key], time: e.target.value } }))}
                    className="nb-input w-32 h-9 shrink-0"
                  />
                  <button
                    className="nb-chip h-9 text-xs"
                    style={det?.office_called ? { backgroundColor: "hsl(var(--secondary))", color: "#fff" } : {}}
                    onClick={() => setDetails((d) => ({ ...d, [item.key]: { ...d[item.key], office_called: !d[item.key]?.office_called } }))}
                  >
                    Office called
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="nb-btn w-full h-14 bg-primary text-primary-foreground mt-4" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save red flag check"}
      </button>
    </div>
  );
}