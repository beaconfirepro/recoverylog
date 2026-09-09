import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";

// Everyone the patient has let into the open log. Read from one place so the
// care page and the profile can never disagree about who is on the team.
export function useCareTeam() {
  const { patientId } = usePatient();
  const [team, setTeam] = useState([]);

  const reload = useCallback(async () => {
    if (!patientId) {
      setTeam([]);
      return;
    }
    const rows = await base44.entities.AppUser.filter(
      { patient_id: patientId, kind: "team_member" },
      "created_date",
      50
    );
    setTeam(asRows(rows));
  }, [patientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { team, reload };
}
