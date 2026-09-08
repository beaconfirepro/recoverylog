import React from "react";
import { fullDate } from "@/lib/dates";
import { usePatient, displayName } from "@/lib/PatientContext";

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5 border-b-2 last:border-b-0 min-w-0">
    <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm font-bold text-right break-words min-w-0">{value || "—"}</span>
  </div>
);

// Whose log this is and what it is tracking, at the top of the day. It used to
// live on Profile, which was wrong for a care team member: their profile is
// their own account, and the patient is what they are looking at.
export default function PatientCard() {
  const { patient, activeSurgery } = usePatient();

  return (
    <div className="nb-card overflow-hidden">
      <div className="px-4 py-3 border-b-2 bg-muted">
        <div className="font-display text-xl uppercase leading-tight break-words">
          {displayName(patient) || "Patient"}
        </div>
      </div>
      <div className="p-4">
        <Row label="Tracking" value={activeSurgery?.label} />
        <Row label="Surgery date" value={activeSurgery?.surgery_date ? fullDate(activeSurgery.surgery_date) : null} />
        <Row label="Surgeon" value={activeSurgery?.surgeon} />
        <Row label="Office" value={activeSurgery?.office_phone} />
      </div>
    </div>
  );
}
