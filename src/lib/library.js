import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { asRows } from "@/lib/recoveryUtils";

// The things she sets up once and then picks from: her garments, her med
// groups. They belong to the patient rather than to a surgery, because the
// garments in the drawer do not change when a second surgery is added.
export function useLibrary(entityName) {
  const { patientId } = usePatient();
  const [rows, setRows] = useState([]);

  const reload = useCallback(async () => {
    setRows(asRows(await base44.entities[entityName].list("sort_order", 100)));
  }, [entityName]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = async (fields) => {
    await base44.entities[entityName].create({ ...fields, patient_id: patientId, sort_order: rows.length });
    await reload();
  };

  const update = async (id, fields) => {
    await base44.entities[entityName].update(id, fields);
    await reload();
  };

  const remove = async (id) => {
    await base44.entities[entityName].delete(id);
    await reload();
  };

  return { rows, add, update, remove, reload };
}
