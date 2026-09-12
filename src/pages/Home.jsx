import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DayView from "@/components/recovery/DayView";
import PatientCard from "@/components/recovery/PatientCard";
import InstallHint from "@/components/InstallHint";
import { todayStr } from "@/lib/dates";
import { usePatient } from "@/lib/PatientContext";
import { loadOrientation, saveOrientation, allDone } from "@/lib/orientation";
import OrientationChecklist from "@/components/orientation/OrientationChecklist";
import OrientationFab from "@/components/orientation/OrientationFab";
import { useOrientationHighlight } from "@/lib/useOrientationHighlight";

export default function Home() {
  const { isOwner, patientId, surgeries } = usePatient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const forceOpen = params.get("orientation") === "1";

  const [state, setStateLocal] = useState(() => loadOrientation(patientId));
  useEffect(() => {
    setStateLocal(loadOrientation(patientId));
  }, [patientId]);
  const setState = (next) => {
    setStateLocal(next);
    saveOrientation(patientId, next);
  };

  // openedByFab is a transient re-open — not persisted — so a surgery existing
  // still collapses the checklist to the button until the user taps it.
  const [openedByFab, setOpenedByFab] = useState(false);

  // Pulses the section a checklist step points at when the step lands here.
  useOrientationHighlight();

  // A maintenance record is a Surgery row, so "has a surgery" is not the same
  // as "has a real surgery". The checklist stays front-and-centre until a real
  // surgery exists or it is minimised, so a no-surgery patient is not dropped
  // onto a blank day by the auto-created maintenance record.
  const hasRealSurgery = surgeries.some((s) => s.mode !== "maintenance" && !s.archived && !s.cancelled);
  const active = isOwner && !state.dismissed && !allDone(state);
  const expanded =
    active && (!state.minimized && !hasRealSurgery ? true : openedByFab || forceOpen);
  const showFab = isOwner && active && !expanded;

  const onNavigate = (item, choice) => {
    // Item 1 hands the tracking toggles to the new-surgery modal on Care.
    if (item.kind === "surgery") {
      if (choice === "surgery") {
        navigate("/care", {
          state: {
            openNewSurgery: {
              track_before: state.track_before !== false,
              track_after: state.track_after !== false
            }
          }
        });
      }
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      setOpenedByFab(false);
      return;
    }
    if (item.kind === "yesno" && choice === "yes") {
      navigate(item.yes.target, { state: item.highlight ? { orient: item.highlight } : null });
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      return;
    }
    if (item.target) {
      navigate(item.target, { state: item.highlight ? { orient: item.highlight } : null });
      setState({ ...state, items: { ...state.items, [item.key]: true } });
      setOpenedByFab(false);
    }
  };

  const minimize = () => {
    setState({ ...state, minimized: true });
    setOpenedByFab(false);
    if (forceOpen) navigate("/", { replace: true });
  };
  const dismiss = () => {
    setState({ ...state, dismissed: true });
    setOpenedByFab(false);
    if (forceOpen) navigate("/", { replace: true });
  };

  return (
    <div className="space-y-4">
      {!isOwner && <PatientCard />}

      {/* The whole layout is built for standalone — safe-area insets, a fixed
          tab bar, a translucent status bar — and iOS Safari never offers the
          install itself, so most people would only ever see the version with a
          browser bar sitting over the tabs. */}
      <InstallHint />

      {expanded ? (
        <OrientationChecklist
          state={state}
          setState={setState}
          onMinimize={minimize}
          onDismiss={dismiss}
          onNavigate={onNavigate}
        />
      ) : (
        <DayView date={todayStr()} />
      )}

      {showFab && <OrientationFab label="Get started" onClick={() => setOpenedByFab(true)} />}
    </div>
  );
}