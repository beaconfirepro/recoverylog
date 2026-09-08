import React from "react";
import DayView from "@/components/recovery/DayView";
import PatientCard from "@/components/recovery/PatientCard";
import { todayStr } from "@/lib/dates";
import { usePatient } from "@/lib/PatientContext";

export default function Home() {
  const { isOwner } = usePatient();
  return (
    <div className="space-y-4">
      {/* The patient's own log does not need to be told whose it is. A care
          team member does, on the page they spend their time on. */}
      {!isOwner && <PatientCard />}
      <DayView date={todayStr()} />
    </div>
  );
}
