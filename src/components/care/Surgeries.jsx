import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePatient } from "@/lib/PatientContext";
import { isMaintenance } from "@/lib/scope";
import { Plus, Scissors, HeartPulse } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SurgeryCard from "@/components/care/SurgeryCard";
import SurgeryForm from "@/components/care/SurgeryForm";

// The surgeries on the open log. The + in the header opens a modal to add one;
// tapping a card opens it to show the details, and makes it the active surgery.
// Arriving from the orientation checklist with openNewSurgery pops the modal
// open and seeds the new surgery's tracking toggles.
export default function Surgeries() {
  const { surgeries, activeSurgeryId, selectSurgery, canWrite, patientId, refreshSurgeries } = usePatient();
  const location = useLocation();
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefillTrack, setPrefillTrack] = useState(null);
  const hasMaintenance = surgeries.some(isMaintenance);

  useEffect(() => {
    if (location.state?.openNewSurgery && canWrite) {
      setPrefillTrack(location.state.openNewSurgery);
      setAdding(true);
    }
  }, [location.state, canWrite]);

  // A patient who already had surgeries before maintenance existed does not
  // get one auto-created. This is the one place they can start it.
  const startMaintenance = async () => {
    const created = await base44.entities.Surgery.create({
      patient_id: patientId,
      label: "Maintenance",
      mode: "maintenance",
      surgery_date: null,
      track_before: true,
      track_after: true,
      archived: false
    });
    await refreshSurgeries();
    selectSurgery(created.id);
  };

  return (
    <>
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted flex items-center gap-2">
          <Scissors className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl uppercase leading-tight break-words">Surgeries</div>
            <div className="text-sm font-semibold break-words">Each keeps its own days.</div>
          </div>
          {canWrite && (
            <button
              type="button"
              className="nb-btn h-9 w-9 shrink-0 bg-card p-0"
              aria-label="Add a surgery"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4 space-y-2">
          {surgeries.length === 0 && (
            <p className="text-sm text-muted-foreground break-words">
              No surgeries yet. Tap + to add one and your days start counting from its date.
            </p>
          )}
          {surgeries.map((s) => (
            <SurgeryCard
              key={s.id}
              surgery={s}
              active={s.id === activeSurgeryId}
              open={expanded === s.id}
              canWrite={canWrite}
              onToggle={() => {
                setExpanded(expanded === s.id ? null : s.id);
                selectSurgery(s.id);
              }}
              onEdit={() => setEditing(s)}
            />
          ))}

          {canWrite && !hasMaintenance && (
            <button
              type="button"
              onClick={startMaintenance}
              className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2"
            >
              <HeartPulse className="w-4 h-4 shrink-0" />
              Start a maintenance log
            </button>
          )}
        </div>
      </div>

      <Dialog
        open={adding}
        onOpenChange={(o) => {
          if (!o) {
            setAdding(false);
            setPrefillTrack(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          {adding && (
            <SurgeryForm
              prefillTrack={prefillTrack}
              onSaved={() => {
                setAdding(false);
                setPrefillTrack(null);
              }}
              onCancel={() => {
                setAdding(false);
                setPrefillTrack(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          {editing && <SurgeryForm surgery={editing} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}