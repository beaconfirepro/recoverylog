import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { defaultScope } from "@/lib/scope";
import Field from "@/components/Field";

// Cancels a surgery: sets cancelled, the patient's reason, and a timestamp.
// If the surgery was in the active scope, the scope falls back to a remaining
// record so the day page never lands on a cancelled one. The days stay — this
// is not a delete — and the surgery moves to the Cancelled section on Care.
export default function CancelSurgeryDialog({ surgery, onDone, onCancel }) {
  const { scope, setScope, surgeries, refreshSurgeries } = usePatient();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    await base44.entities.Surgery.update(surgery.id, {
      cancelled: true,
      cancelled_reason: reason.trim(),
      cancelled_at: new Date().toISOString()
    });
    const inScope = scope && (scope.all || (scope.ids || []).includes(surgery.id));
    if (inScope) {
      const next = defaultScope(surgeries.filter((s) => s.id !== surgery.id));
      setScope(next);
    }
    await refreshSurgeries();
    setSaving(false);
    onDone();
  };

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h2 className="font-display text-xl uppercase leading-tight break-words">Cancel this surgery</h2>
        <p className="text-sm font-semibold break-words">
          It drops out of your day, history and trends and moves to a Cancelled section here. The days you logged stay — nothing is lost — and you can restore it later.
        </p>
      </div>
      <Field label="Why is it cancelled?" span hint="required">
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. postponed, changed surgeon, no longer needed"
          className="nb-textarea"
        />
      </Field>
      <div className="flex gap-2 min-w-0">
        <button
          type="button"
          className="nb-btn flex-1 min-w-0 h-14 bg-destructive text-destructive-foreground"
          onClick={confirm}
          disabled={saving || !reason.trim()}
        >
          {saving ? "Cancelling…" : "Cancel surgery"}
        </button>
        <button type="button" className="nb-btn h-14 px-5 shrink-0 bg-card" onClick={onCancel} disabled={saving}>
          Keep it
        </button>
      </div>
    </div>
  );
}