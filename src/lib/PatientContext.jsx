import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { PINNED, QUICK_ORDER } from "@/lib/recovery";
import { asRows } from "@/lib/recoveryUtils";
import { detailsMatch } from "@/lib/invite";

const PatientContext = createContext();

export const displayName = (row) =>
  [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();

// Login emails are matched, not compared: an invite is stored lowercased while
// the account reports whatever the person typed when they registered, and a
// capital letter in one of them must not read as a different person.
export const sameEmail = (a, b) =>
  String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

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
  const [groups, setGroups] = useState([]);
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
    const ours = people.filter((r) => sameEmail(r.email, user.email));
    const own = ours.find((r) => r.kind === "patient") || null;
    const teams = ours.filter((r) => r.kind === "team_member" && r.patient_id);

    // Every log this account can open: their own, if they are a patient, and
    // one per care team they joined. Preferring their own here would pin them
    // to it, and the switch would revert on the next pass.
    const all = [
      ...(own ? [{ row: own, id: own.id, own: true }] : []),
      ...teams.map((t) => ({ row: t, id: t.patient_id, own: false }))
    ];

    // Which log is open. The account's patient_id is what row security scopes
    // every other read to, so switching logs means changing it, not holding a
    // preference next to it.
    const active = all.find((g) => g.id === user.patient_id) || all[0] || null;
    const mine = active?.row || null;
    const groupId = active?.id || null;

    // Bring the account's link in line with the row, then read the group again.
    // The link is what row security scopes to, so this group's patient row was
    // not visible a moment ago. The guard stops a link that will not take from
    // being retried on every pass.
    // patient_id is the log this account reads. write_patient_id is the log it
    // may write to, and it is only ever the account's own. Two fields rather
    // than one flag, because row security compares a row to the user record and
    // cannot reach into another entity to ask whether someone may write.
    const writeId = active?.own ? groupId : null;
    let rows = people;
    if (
      groupId &&
      (user.patient_id !== groupId || (user.write_patient_id || null) !== writeId) &&
      linking.current !== `${groupId}:${writeId}`
    ) {
      linking.current = `${groupId}:${writeId}`;
      await base44.auth.updateMe({ patient_id: groupId, write_patient_id: writeId });
      await checkUserAuth();
      rows = asRows(await base44.entities.AppUser.list("created_date", 50));
    }

    const p = rows.find((r) => r.id === groupId && r.kind === "patient") || null;

    setMe(mine);
    setGroups(all);
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
      // Write access follows only your own log. Opening someone else's clears
      // it, so a member never carries a write claim into a log they help with.
      const own = groups.find((g) => g.id === pid)?.own || false;
      const writeId = own ? pid : null;
      linking.current = `${pid}:${writeId}`;
      await base44.auth.updateMe({ patient_id: pid, write_patient_id: writeId });
      await checkUserAuth();
    },
    [checkUserAuth, groups]
  );

  // Confirm the patient's details against the copies on your own membership row
  // and open their log. The check is what turns an invite into access, and the
  // stamp is what stops the care page asking again.
  const claimMembership = useCallback(
    async (row, form) => {
      if (!detailsMatch(row, form)) return false;
      if (!row.claimed_at) {
        await base44.entities.AppUser.update(row.id, { claimed_at: new Date().toISOString() });
      }
      await switchPatient(row.patient_id);
      return true;
    },
    [switchPatient]
  );

  // Step off a care team. Removing your own row is the one deletion row
  // security lets you make against a group you do not own, which is right:
  // access someone gave you is always yours to hand back. Your own log is not
  // a team you can leave; that is Delete my account.
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
        groups,
        switchPatient,
        claimMembership,
        leaveTeam,
        // Only the patient writes. A care team member reads. Nothing in the
        // app hands out write access, so there is no per-member flag to read:
        // being the owner is the whole of it.
        canWrite: isOwner,
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
