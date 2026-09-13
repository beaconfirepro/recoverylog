import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListChecks, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";
import { isMaintenance } from "@/lib/scope";
import {
  loadOrientation, saveOrientation, allDone, deriveDone, doneCount, ORIENTATION_ITEMS
} from "@/lib/orientation";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import OrientationChecklist from "@/components/orientation/OrientationChecklist";

// The floating button that opens the guided tour, on every page. The tour lives
// in a bottom drawer so it slides up over the page with an animation rather
// than replacing it. Tapping a step navigates to where it points and closes the
// drawer, so the page underneath is the one the tour runs on.
export default function OrientationFabGlobal() {
  const { isOwner, patientId, patient, surgeries } = usePatient();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setStateLocal] = useState(() => loadOrientation(patientId));
  const [facts, setFacts] = useState({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setStateLocal(loadOrientation(patientId));
  }, [patientId, location.pathname]);

  const setState = (next) => {
    setStateLocal(next);
    saveOrientation(patientId, next);
  };

  const hasRealSurgery = surgeries.some(
    (s) => s.mode !== "maintenance" && !s.archived && !s.cancelled
  );
  const derived = deriveDone({ ...facts, hasRealSurgery, choice: state.choice });
  const active = isOwner && !state.dismissed && !allDone(state, derived);

  // What the app can see for itself, so the count is honest rather than just
  // the steps she ticked. Runs while the tour is active or the drawer is open —
  // a done user who reopens it from Setup still gets the real ticks.
  useEffect(() => {
    if ((!active && !open) || !patientId) return;
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
        // A count that cannot read the log shows the ticks she made.
      }
    })();
    return () => { live = false; };
  }, [active, open, patientId]);

  useEffect(() => {
    setFacts((f) => ({
      ...f,
      hasNamedCheckinSlot: (patient?.checkin_slots || []).some((x) => x?.label?.trim()),
      hasChosenMeasurements: (patient?.measurements || []).filter(Boolean).length > 0,
      hasChosenTrackers: surgeries.some((sx) => !isMaintenance(sx) && (sx.tracked_types || []).length > 0)
    }));
  }, [patient, surgeries]);

  // The "Open the guided tour" button on Setup navigates here with
  // forceOrientation; open the drawer and clear the state so a back-nav does
  // not re-open it.
  useEffect(() => {
    if (location.state?.forceOrientation) {
      setOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNavigate = (item, choice) => {
    if (item.kind === "surgery") {
      if (choice === "surgery") {
        navigate("/profile", { state: { orient: item.highlight } });
      }
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      setOpen(false);
      return;
    }
    if (item.kind === "yesno" && choice === "yes") {
      navigate(item.yes.target, { state: item.highlight ? { orient: item.highlight } : null });
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      setOpen(false);
      return;
    }
    if (item.target) {
      navigate(item.target, { state: item.highlight ? { orient: item.highlight } : null });
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      setOpen(false);
    }
  };

  const dismiss = () => {
    setState({ ...state, dismissed: true });
    setOpen(false);
  };

  const complete = doneCount(state, derived);
  const total = ORIENTATION_ITEMS.length;

  return (
    <>
      {active && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Guided tour: ${complete} of ${total} done`}
          className="nb-btn fixed right-4 bottom-24 z-40 h-12 px-3 bg-primary text-primary-foreground gap-2"
        >
          <ListChecks className="w-5 h-5 shrink-0" />
          <span className="text-xs font-heading">{complete}/{total}</span>
        </button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[88vh]">
          <div className="flex items-center justify-between px-4 pt-2">
            <div className="font-display text-xl uppercase leading-tight">Guided Tour</div>
            <button
              type="button"
              aria-label="Close the guided tour"
              onClick={() => setOpen(false)}
              className="nb-btn h-9 w-9 bg-card p-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 pb-8 pt-3 overflow-y-auto">
            <OrientationChecklist
              state={state}
              derived={derived}
              setState={setState}
              onDismiss={dismiss}
              onNavigate={onNavigate}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}