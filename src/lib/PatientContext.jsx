import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PINNED, QUICK_ORDER, TYPES } from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";

const PatientContext = createContext();

export const displayName = (row) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();

// Which entry types a surgery offers, in the order it wants them. Empty means
// the surgery has not been narrowed down, which is not the same as tracking
// nothing. Unknown keys are dropped so a stale saved layout cannot blank the
// screen.
export const trackedTypes = (surgery) => {
  const saved = (surgery?.tracked_types || []).filter((t) => TYPES[t]);
  return saved.length ? saved : QUICK_ORDER;
};

const activeKey = (patientId) => `recoverylog.activeSurgery.${patientId}`;

// AppUser mirrors the app's people — the patient and their care team in one
// table. A person's row is written by the patient, never by themselves, so what
// it says about them (their group, whether they can write) is not self-assigned.
export const PatientProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [me, setMe] = useState(null);
  const [patient, setPatient] = useState(null);
  const [surgeries, setSurgeries] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSurgeries = useCallback(async (patientId) => {
    if (!patientId) {
      setSurgeries([]);
      return [];
    }
    const list = asRows(await base44.entities.Surgery.filter({ patient_id: patientId }, "-surgery_date", 50));
    setSurgeries(list);
    return list;
  }, []);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const people = asRows(await base44.entities.AppUser.list("created_date", 50));
    const mine = people.find((r) => r.email === user.email) || null;
    const groupId = mine?.kind === "patient" ? mine.id : mine?.patient_id || null;
    const p = people.find((r) => r.id === groupId && r.kind === "patient") || null;

    // The patient needs the same link a team member gets. Without it she would
    // match row security only on rows she created herself, and anything a team
    // member logged would be invisible to her.
    if (mine?.kind === "patient" && user.patient_id !== mine.id) {
      await base44.auth.updateMe({ patient_id: mine.id });
    }

    setMe(mine);
    setPatient(p);
    const list = await loadSurgeries(p?.id);
    if (p) {
      let stored = null;
      try {
        stored = window.localStorage.getItem(activeKey(p.id));
      } catch {
        stored = null;
      }
      const usable = list.find((s) => s.id === stored) || list.find((s) => !s.archived) || list[0] || null;
      setActiveId(usable?.id || null);
    }
    setLoading(false);
  }, [isAuthenticated, user, loadSurgeries]);

  useEffect(() => {
    load();
  }, [load]);

  const selectSurgery = useCallback(
    (id) => {
      setActiveId(id);
      try {
        if (patient) window.localStorage.setItem(activeKey(patient.id), id);
      } catch {
        // A browser that refuses storage still gets the selection for this visit.
      }
    },
    [patient]
  );

  const activeSurgery = useMemo(
    () => surgeries.find((s) => s.id === activeId) || null,
    [surgeries, activeId]
  );

  const isOwner = me?.kind === "patient";
  const linked = isOwner || (!!me && !!me.patient_id && user?.patient_id === me.patient_id);

  return (
    <PatientContext.Provider
      value={{
        me,
        patient,
        patientId: patient?.id || null,
        isOwner,
        linked,
        canWrite: me?.can_write !== false,
        loadingPatient: loading,
        refreshPatient: load,
        surgeries,
        activeSurgery,
        activeSurgeryId: activeId,
        selectSurgery,
        refreshSurgeries: () => loadSurgeries(patient?.id)
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within a PatientProvider");
  return ctx;
};