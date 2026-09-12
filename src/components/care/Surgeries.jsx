import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePatient } from "@/lib/PatientContext";
import { Plus, Scissors } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SurgeryCard from "@/components/care/SurgeryCard";
import SurgeryForm from "@/components/care/SurgeryForm";

// The surgeries on the open log. The + in the header opens a modal to add one;
// tapping a card opens it to show the details, and makes it the active surgery.
// Arriving from the orientation checklist with openNewSurgery pops the modal
// open and seeds the new surgery's tracking toggles.
export default function Surgeries() {
  const { surgeries, activeSurgeryId, selectSurgery, canWrite } = usePatient();
  const location = useLocation();
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefillTrack, setPrefillTrack] = useState(null);

  useEffect(() => {
    if (location.state?.openNewSurgery && canWrite) {
      setPrefillTrack(location.state.openNewSurgery);
      setAdding(true);
    }
  }, [location.state, canWrite]);

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