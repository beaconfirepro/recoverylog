import React from "react";
import DayView from "@/components/recovery/DayView";
import PatientCard from "@/components/recovery/PatientCard";
import InstallHint from "@/components/InstallHint";
import { todayStr } from "@/lib/dates";
import { usePatient } from "@/lib/PatientContext";
import TaskReminders from "@/components/recovery/TaskReminders";
import { useOrientationHighlight } from "@/lib/useOrientationHighlight";

// Today. The guided tour checklist lives in a drawer off the floating button
// (OrientationFabGlobal in Layout), so this page is always the day view.
export default function Home() {
  const { isOwner } = usePatient();
  // Pulses the section a checklist step points at when it sends the patient
  // here (the first check-in and red-flag steps target today).
  useOrientationHighlight();

  return (
    <div className="space-y-4">
      {!isOwner && <PatientCard />}

      {/* The whole layout is built for standalone — safe-area insets, a fixed
          tab bar, a translucent status bar — and iOS Safari never offers the
          install itself, so most people would only ever see the version with a
          browser bar sitting over the tabs. */}
      <InstallHint />

      <TaskReminders />
      <DayView date={todayStr()} />
    </div>
  );
}