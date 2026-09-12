import React from "react";
import { todayStr, postOpLabel, fullDate } from "@/lib/dates";
import { ChevronDown, Pencil, Phone, Stethoscope, FileText, Thermometer, Calendar, User } from "lucide-react";

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

// One surgery as a card that opens to show its details. Tapping the header also
// makes it the active surgery the day page tracks.
export default function SurgeryCard({ surgery, active, open, canWrite, onToggle, onEdit }) {
  const s = surgery;
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
            {s.surgery_date ? `${postOpLabel(s.surgery_date, todayStr()) || "Surgery"} · ${s.surgery_date}` : "No date"}
            {s.archived ? " · archived" : ""}
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="p-3 border-t-2 space-y-2">
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

          {canWrite && (
            <button
              type="button"
              className="nb-btn w-full h-11 bg-card flex items-center justify-center gap-2"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}