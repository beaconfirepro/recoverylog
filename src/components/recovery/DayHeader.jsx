import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseDate } from "@/lib/dates";

const Stat = ({ label, value }) => (
  <div className="border-2 rounded-xl px-2.5 py-1.5 bg-muted">
    <div className="text-[9px] font-heading uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-bold truncate">{value}</div>
  </div>
);

export default function DayHeader({ day, dayNumber, totals, lastBm, spots, onSaved, onSpotsChanged }) {
  const [open, setOpen] = useState(false);
  const [wokeAt, setWokeAt] = useState(day.woke_at || "");
  const [sleptHours, setSleptHours] = useState(day.slept_hours ?? "");
  const [sleptPosition, setSleptPosition] = useState(day.slept_position || "");
  const [newSpot, setNewSpot] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.RecoveryDay.update(day.id, {
      woke_at: wokeAt,
      slept_hours: sleptHours === "" ? null : +sleptHours,
      slept_position: sleptPosition
    });
    setSaving(false);
    setOpen(false);
    onSaved();
  };

  const addSpot = async () => {
    const name = newSpot.trim();
    if (!name) return;
    await base44.entities.MeasurementSpot.create({ name, sort_order: spots.length });
    setNewSpot("");
    onSpotsChanged();
  };

  const removeSpot = async (id) => {
    await base44.entities.MeasurementSpot.delete(id);
    onSpotsChanged();
  };

  const measEntries = totals.measurements
    ? Object.entries(totals.measurements).filter(([k, v]) => v !== null && v !== "" && k !== "photo_url")
    : [];

  return (
    <div className="nb-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl leading-none uppercase">
            Day {dayNumber}
          </h1>
          <p className="text-sm font-semibold text-muted-foreground mt-1">
            {parseDate(day.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button className="nb-btn h-11 w-11 !rounded-xl bg-accent text-accent-foreground" onClick={() => setOpen(true)} aria-label="Edit day header">
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Stat label="Last BM" value={lastBm} />
        <Stat label="Next med" value={totals.nextMed ? `${totals.nextMed.time}` : "—"} />
        <Stat label="Woke at" value={day.woke_at || "—"} />
        <Stat label="Temp AM" value={totals.tempAm ?? "—"} />
        <Stat label="Temp PM" value={totals.tempPm ?? "—"} />
        <Stat label="Weight" value={totals.weight ?? "—"} />
        <Stat label="Slept" value={day.slept_hours ? `${day.slept_hours}h` : "—"} />
        <Stat label="Position" value={day.slept_position || "—"} />
        <Stat label="Photos" value={totals.photoTaken ? "Yes" : "No"} />
      </div>

      {measEntries.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {measEntries.map(([k, v]) => (
            <Stat key={k} label={k} value={v} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading uppercase">Edit day header</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase">Woke at</Label>
              <Input type="time" value={wokeAt} onChange={(e) => setWokeAt(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase">Slept (hours)</Label>
              <Input type="number" inputMode="decimal" min="0" value={sleptHours} onChange={(e) => setSleptHours(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase">Slept position</Label>
              <div className="flex flex-wrap gap-1.5">
                {["recliner", "wedge", "propped", "flat", "side"].map((p) => (
                  <button
                    key={p}
                    className="nb-chip"
                    style={sleptPosition === p ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" } : {}}
                    onClick={() => setSleptPosition(sleptPosition === p ? "" : p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-heading text-xs uppercase">Measurement spots (name once, use daily)</Label>
              <div className="flex flex-wrap gap-1.5">
                {spots.map((s) => (
                  <span key={s.id} className="nb-chip inline-flex items-center gap-1 bg-secondary text-secondary-foreground">
                    {s.name}
                    <button onClick={() => removeSpot(s.id)} aria-label={`Remove ${s.name}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newSpot} onChange={(e) => setNewSpot(e.target.value)} placeholder="e.g. waist, left thigh" className="h-12" />
                <button className="nb-btn h-12 px-4 bg-accent text-accent-foreground" onClick={addSpot}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button className="nb-btn w-full h-14 bg-primary text-primary-foreground" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save header"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}