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

      {/* Which build this is. The Base44 editor shows its own last commit
          rather than the branch tip, so this is the only honest answer to
          "is my change live yet". */}
      <p className="pt-2 text-center text-[10px] font-mono text-muted-foreground select-all">
        {__BUILD_COMMIT__} · {__BUILD_TIME__.slice(0, 16).replace("T", " ")}Z
      </p>
    </div>
  );
}
