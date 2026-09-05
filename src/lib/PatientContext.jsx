import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const PatientContext = createContext();

export const displayName = (row) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();

// AppUser mirrors the app's people — the patient and their care team in one
// table. A person's row is written by the patient, never by themselves, so what
// it says about them (their group, whether they can write) is not self-assigned.
export const PatientProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [me, setMe] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Row security limits this to your own row, your group, and the patient's
    // row, so everything that comes back is already yours to see.
    const rows = await base44.entities.AppUser.list("created_date", 50);
    const mine = rows.find((r) => r.email === user.email) || null;
    const groupId = mine?.kind === "patient" ? mine.id : mine?.patient_id || null;
    const p = rows.find((r) => r.id === groupId && r.kind === "patient") || null;

    // The patient needs the same link a team member gets. Without it she would
    // match row security only on rows she created herself, and anything a team
    // member logged would be invisible to her.
    if (mine?.kind === "patient" && user.patient_id !== mine.id) {
      await base44.auth.updateMe({ patient_id: mine.id });
    }

    setMe(mine);
    setPatient(p);
    setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = me?.kind === "patient";
  // A team member is only in once their account is actually linked to the group.
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
        refreshPatient: load
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
