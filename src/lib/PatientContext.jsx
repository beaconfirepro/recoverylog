import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PINNED, QUICK_ORDER } from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";

const PatientContext = createContext();

export const displayName = (row) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();

// The arrangeable buttons a surgery offers, in the order it wants them. Empty
// means the surgery has not been narrowed down, which is not the same as
// tracking nothing. Filtered against what is still offered, so a saved layout
// naming a retired type — or the pinned check-in, which is not one of these —
// cannot put its button back.
export const trackedTypes = (surgery) => {
  const saved = asRows(surgery?.tracked_types).filter((t) => t !== PINNED && QUICK_ORDER.includes(t));
  return saved.length ? saved : QUICK_ORDER;
};

const activeKey = (patientId) => `recoverylog.activeSurgery.${patientId}`;

// AppUser mirrors the app's people — the patient and their care team in one
// table. A person's row is written by the patient, never by themselves, so what
// it says about them (their group, whether they can write) is not self-assigned.
export const PatientProvider = ({ children }) => {
  const { user, isAuthenticated, checkUserAuth } = useAuth();
  const [me, setMe] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [patient, setPatient] = useState(null);
  const [surgeries, setSurgeries] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  // The group we last asked the account to point at, so a link that does not
  // take is tried once rather than every render.
  const linking = useRef(null);

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
    // A person can hold several rows: their own patient row, and one for each
    // care team they were invited to. Row security matches every row carrying
    // their email, so all of them come back in this one read.
    const ours = people.filter((r) => r.email === user.email);
    const own = ours.find((r) => r.kind === "patient") || null;
    const teams = ours.filter((r) => r.kind === "team_member" && r.patient_id);

    // Which log is open. The account's patient_id is what row security scopes
    // every other read to, so switching logs means changing it, not holding a
    // preference next to it.
    const mine = own || teams.find((t) => t.patient_id === user.patient_id) || teams[0] || null;
    const groupId = own ? own.id : mine?.patient_id || null;

    // Bring the account's link in line with the row, then read the group again.
    // The link is what row security scopes to, so this group's patient row was
    // not visible a moment ago. The guard stops a link that will not take from
    // being retried on every pass.
    let rows = people;
    if (groupId && user.patient_id !== groupId && linking.current !== groupId) {
      linking.current = groupId;
      await base44.auth.updateMe({ patient_id: groupId });
      await checkUserAuth();
      rows = asRows(await base44.entities.AppUser.list("created_date", 50));
    }

    const p = rows.find((r) => r.id === groupId && r.kind === "patient") || null;

    setMe(mine);
    setMemberships(teams);
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
  }, [isAuthenticated, user, loadSurgeries, checkUserAuth]);

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

  // Open a different patient's log. Only a care team member has more than one.
  const switchPatient = useCallback(
    async (pid) => {
      linking.current = pid;
      await base44.auth.updateMe({ patient_id: pid });
      await checkUserAuth();
    },
    [checkUserAuth]
  );

  // Step off a care team. Removing your own row is the one deletion row
  // security lets you make against a group you do not own, which is right:
  // access someone gave you is always yours to hand back.
  const leaveTeam = useCallback(
    async (rowId) => {
      await base44.entities.AppUser.delete(rowId);
      linking.current = null;
      await load();
    },
    [load]
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
        memberships,
        switchPatient,
        leaveTeam,
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
