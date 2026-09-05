import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const PatientContext = createContext();

// Every name on the claim screen is shown as initial + asterisks, so the list
// confirms which invite is yours without printing anyone's name in full.
export const maskName = (name) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] + "*".repeat(Math.max(w.length - 1, 1)))
    .join(" ");

export const PatientProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [patient, setPatient] = useState(null);
  const [membership, setMembership] = useState(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Row-level security already limits these to the patient this account owns
    // and the one its user record is linked to, so whatever comes back is ours.
    const [visible, mine] = await Promise.all([
      base44.entities.Patient.list("created_date", 10),
      base44.entities.PatientGroup.filter({ email: user.email }, "created_date", 10)
    ]);
    const owned = visible.find((p) => p.owner_email === user.email);
    const linked = visible.find((p) => p.id === user.patient_id);
    // The patient needs the same link everyone else gets. Without it she matches
    // row security only on rows she created herself, so anything a care-team
    // member logged would be invisible to her.
    if (owned && user.patient_id !== owned.id) {
      await base44.auth.updateMe({ patient_id: owned.id });
    }
    setPatient(owned || linked || null);
    setMembership(owned ? null : mine.find((m) => m.patient_id === user.patient_id) || null);
    setInvites(mine);
    setLoading(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = !!patient && patient.owner_email === user?.email;

  return (
    <PatientContext.Provider
      value={{
        patient,
        patientId: patient?.id || null,
        isOwner,
        membership,
        invites,
        canWrite: isOwner || membership?.can_write !== false,
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
