import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListChecks } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";
import { isMaintenance } from "@/lib/scope";
import {
  loadOrientation, allDone, deriveDone, doneCount, ORIENTATION_ITEMS
} from "@/lib/orientation";

// The floating button that re-opens the guided tour. It lives in Layout so it
// appears on every page, and it carries the x-of-y count so the patient can see
// how far she has got from anywhere in the app.
//
// Tapping it sends her to Today with a flag that expands the checklist. While
// the checklist is expanded on Today the button hides — she is already looking
// at it — and comes back once she minimises.
export default function OrientationFabGlobal() {
  const { isOwner, patientId, patient, surgeries } = usePatient();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadOrientation(patientId));
  const [facts, setFacts] = useState({});

  // Re-read the saved state on every navigation so a tick made on another page
  // is reflected straight away.
  useEffect(() => {
    setState(loadOrientation(patientId));
  }, [patientId, location.pathname]);

  const hasRealSurgery = surgeries.some(
    (s) => s.mode !== "maintenance" && !s.archived && !s.cancelled
  );
  const derived = deriveDone({ ...facts, hasRealSurgery, choice: state.choice });
  const active = isOwner && !state.dismissed && !allDone(state, derived);

  // The facts the app can see for itself, so the count is honest rather than
  // just the steps she ticked. Only fetched while the tour is active — once it
  // is done the button is gone and these never run.
  useEffect(() => {
    if (!active || !patientId) return;
    let live = true;
    (async () => {
      try {
        const [garments, medGroups, team, checkins, days] = await Promise.all([
          base44.entities.Garment.list("sort_order", 1),
          base44.entities.MedGroup.list("sort_order", 1),
          base44.entities.AppUser.filter({ patient_id: patientId, kind: "team_member" }, "created_date", 1),
          base44.entities.RecoveryEntry.filter({ patient_id: patientId, type: "checkin" }, "-date", 1),
          base44.entities.RecoveryDay.filter({ patient_id: patientId }, "-date", 50)
        ]);
        if (!live) return;
        setFacts({
          hasGarment: asRows(garments).length > 0,
          hasMedGroup: asRows(medGroups).length > 0,
          hasTeamMember: asRows(team).length > 0,
          hasCheckin: asRows(checkins).length > 0,
          hasRedFlagAnswer: asRows(days).some((d) => Object.keys(d.red_flag_answers || {}).length > 0)
        });
      } catch {
        // A count that cannot read the log shows the ticks she made, which is
        // better than no count.
      }
    })();
    return () => { live = false; };
  }, [active, patientId]);

  // Read off the patient and surgeries for the facts that do not need a fetch.
  useEffect(() => {
    setFacts((f) => ({
      ...f,
      hasNamedCheckinSlot: (patient?.checkin_slots || []).some((x) => x?.label?.trim()),
      hasChosenMeasurements: (patient?.measurements || []).filter(Boolean).length > 0,
      hasChosenTrackers: surgeries.some((sx) => !isMaintenance(sx) && (sx.tracked_types || []).length > 0)
    }));
  }, [patient, surgeries]);

  const forceOpen = location.state?.forceOrientation === true;
  const onHome = location.pathname === "/" || location.pathname.startsWith("/day");
  const homeExpanded = onHome && (forceOpen || (active && !state.minimized && !hasRealSurgery));

  if (!active || homeExpanded) return null;

  const complete = doneCount(state, derived);
  const total = ORIENTATION_ITEMS.length;

  return (
    <button
      type="button"
      onClick={() => navigate("/", { state: { forceOrientation: true } })}
      aria-label={`Guided tour: ${complete} of ${total} done`}
      className="nb-btn fixed right-4 bottom-24 z-40 h-12 px-3 bg-primary text-primary-foreground gap-2"
    >
      <ListChecks className="w-5 h-5 shrink-0" />
      <span className="text-xs font-heading">{complete}/{total}</span>
    </button>
  );
}