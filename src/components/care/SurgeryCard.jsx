import React from "react";
import { todayStr, postOpLabel, fullDate } from "@/lib/dates";
import { ChevronDown, Pencil, Phone, Stethoscope, FileText, Thermometer, Calendar, User, HeartPulse, Ban, RotateCcw } from "lucide-react";
import { isMaintenance } from "@/lib/scope";

function Detail({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div className="min-w-0">
        <div className="nb-label text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold break-words">{value}</div>
      </div>
    </div>
  );
}

// One record as a card that opens to show its details. A surgery shows its
// date, procedure, surgeon and office; the maintenance record has none of
// those, so its card is the label, a lime "Maintenance" tag and its notes.
// Tapping the header also makes it the record the day page tracks.
export default function SurgeryCard({ surgery, active, open, canWrite, onToggle, onEdit, onCancel, onRestore }) {
  const s = surgery;
  const maint = isMaintenance(s);
  return (
    <div className="border-2 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full text-left p-3 flex items-center gap-2 min-w-0"
        onClick={onToggle}
        style={active ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" } : {}}
      >
        <span className="flex-1 min-w-0">
          <span className="block font-bold truncate">{s.label}</span>
          <span className="block text-xs font-semibold opacity-80 truncate">
            {maint
              ? "Logs by date · no surgery day"
              : s.surgery_date
                ? `${postOpLabel(s.surgery_date, todayStr()) || "Surgery"} · ${s.surgery_date}`
                : "No date"}
            {s.archived ? " · archived" : ""}
            {s.cancelled ? " · cancelled" : ""}
          </span>
        </span>
        {maint && !active && (
          <span
            className="nb-chip px-2 py-0.5 text-[10px] shrink-0"
            style={{ backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
          >
            Maintenance
          </span>
        )}
        {s.cancelled && (
          <span
            className="nb-chip px-2 py-0.5 text-[10px] shrink-0"
            style={{ backgroundColor: "hsl(var(--destructive))", color: "hsl(var(--destructive-foreground))" }}
          >
            Cancelled
          </span>
        )}
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-3 border-t-2 space-y-2">
          {maint ? (
            <>
              <div className="flex items-start gap-2 min-w-0">
                <HeartPulse className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="nb-label text-muted-foreground">Maintenance log</div>
                  <div className="text-sm font-semibold break-words">
                    Entries file by calendar date with no day-zero count.
                  </div>
                </div>
              </div>
              <Detail icon={FileText} label="Notes" value={s.notes} />
            </>
          ) : (
            <>
              {s.cancelled && (
                <Detail icon={Ban} label="Cancelled reason" value={s.cancelled_reason} />
              )}
              <Detail
                icon={Calendar}
                label="Date"
                value={s.surgery_date ? `${fullDate(s.surgery_date)}${s.surgery_time ? ` · ${s.surgery_time}` : ""}` : null}
              />
              <Detail icon={Stethoscope} label="Procedure" value={s.procedure} />
              <Detail icon={User} label="Surgeon" value={s.surgeon} />
              <Detail icon={Phone} label="Office phone" value={s.office_phone} />
              <Detail icon={Thermometer} label="Call if fever over" value={s.fever_threshold != null ? `${s.fever_threshold} °F` : null} />
              <Detail icon={FileText} label="Notes" value={s.notes} />
            </>
          )}

          {canWrite && (
            <div className="space-y-2">
              {!maint && !s.cancelled && (
                <button
                  type="button"
                  className="nb-btn w-full h-11 bg-card flex items-center justify-center gap-2"
                  onClick={onCancel}
                >
                  <Ban className="w-4 h-4" /> Cancel surgery
                </button>
              )}
              {s.cancelled && (
                <button
                  type="button"
                  className="nb-btn w-full h-11 bg-primary text-primary-foreground flex items-center justify-center gap-2"
                  onClick={onRestore}
                >
                  <RotateCcw className="w-4 h-4" /> Restore
                </button>
              )}
              <button
                type="button"
                className="nb-btn w-full h-11 bg-card flex items-center justify-center gap-2"
                onClick={onEdit}
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}