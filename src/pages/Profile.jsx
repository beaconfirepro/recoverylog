import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";
import { LogOut, Plus, X } from "lucide-react";
import { todayStr, dateRange, fullDate, postOpLabel, daysBetween, MAX_RANGE_DAYS } from "@/lib/dates";
import { TYPES, RED_FLAG_ITEMS } from "@/lib/recovery";
import { computeTotals, sortEntries } from "@/lib/daySummary";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName } from "@/lib/PatientContext";
import Field from "@/components/Field";

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 py-1.5 border-b-2 last:border-b-0 min-w-0">
    <span className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm font-bold text-right break-words min-w-0">{value || "—"}</span>
  </div>
);

export default function Profile() {
  const { user, logout } = useAuth();
  const { patient, patientId, isOwner, canWrite, refreshPatient } = usePatient();
  const [surgery, setSurgery] = useState(null);
  const [team, setTeam] = useState([]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [savingPatient, setSavingPatient] = useState(false);
  const [invite, setInvite] = useState({ email: "", first_name: "", last_name: "" });
  const [inviteError, setInviteError] = useState("");
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    base44.entities.SurgeryInfo.list("created_date", 1).then((info) => setSurgery(info[0] || null));
  }, []);

  useEffect(() => {
    setFirst(patient?.first_name || "");
    setLast(patient?.last_name || "");
    setDob(patient?.dob || "");
  }, [patient]);

  const loadTeam = useCallback(() => {
    if (!patientId) return;
    base44.entities.AppUser.filter({ patient_id: patientId, kind: "team_member" }, "created_date", 50).then(setTeam);
  }, [patientId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const savePatient = async () => {
    setSavingPatient(true);
    await base44.entities.AppUser.update(patient.id, { first_name: first.trim(), last_name: last.trim(), dob: dob || null });
    await refreshPatient();
    setSavingPatient(false);
  };

  const addMember = async () => {
    const email = invite.email.trim().toLowerCase();
    if (!email || !invite.first_name.trim() || !invite.last_name.trim()) {
      setInviteError("Email, first name and last name are all needed.");
      return;
    }
    if (team.some((m) => m.email === email)) {
      setInviteError("That email is already on the care team.");
      return;
    }
    setInviteError("");
    await base44.entities.AppUser.create({
      patient_id: patientId,
      kind: "team_member",
      email,
      first_name: invite.first_name.trim(),
      last_name: invite.last_name.trim(),
      can_write: true
    });
    setInvite({ email: "", first_name: "", last_name: "" });
    loadTeam();
  };

  const removeMember = async (id) => {
    await base44.entities.AppUser.delete(id);
    loadTeam();
  };

  // dateRange() stops at MAX_RANGE_DAYS. Silently dropping days out of a record
  // meant for a surgeon is worse than refusing, so block the export instead.
  const spanDays = daysBetween(from, to) + 1;
  const tooWide = spanDays > MAX_RANGE_DAYS;

  const generate = async () => {
    setBusy(true);
    setDone(false);
    const info = await base44.entities.SurgeryInfo.list("created_date", 1);
    const surgeryDate = info[0]?.surgery_date || null;
    const days = await base44.entities.RecoveryDay.list("date", 500);
    const dayMap = {};
    days.forEach((d) => {
      dayMap[d.date] = d;
    });
    const entries = await base44.entities.RecoveryEntry.list("created_date", 3000);
    const byDate = {};
    entries.forEach((e) => {
      (byDate[e.date] = byDate[e.date] || []).push(e);
    });

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const M = 42;
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    let y = M;

    const line = (text, opts = {}) => {
      const size = opts.size || 10;
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.splitTextToSize(text, W - 2 * M).forEach((w) => {
        if (y > H - M) {
          doc.addPage();
          y = M;
        }
        doc.text(w, M, y);
        y += size + 4;
      });
      y += opts.gap || 0;
    };

    line("RECOVERY LOG", { bold: true, size: 18, gap: 2 });
    line(`${from} to ${to}`, { size: 10, gap: 10 });

    dateRange(from, to).forEach((date) => {
      const day = dayMap[date];
      const dayEntries = sortEntries(byDate[date] || []);
      if (!day && dayEntries.length === 0) return;
      const totals = computeTotals(dayEntries, date);

      line(`${(postOpLabel(surgeryDate, date) || "Surgery date not set").toUpperCase()} — ${fullDate(date)}`, { bold: true, size: 13, gap: 2 });
      // Woke/Slept are only on older days — the app records sleep as an entry
      // now — so print them when present rather than a row of dashes.
      line(
        [
          day?.woke_at && `Woke ${day.woke_at}`,
          `Temp AM ${totals.tempAm ?? "—"} / PM ${totals.tempPm ?? "—"}`,
          `Weight ${totals.weight ?? "—"}`,
          day?.slept_hours != null && `Slept ${day.slept_hours}h${day.slept_position ? ` ${day.slept_position}` : ""}`,
          `Photos ${totals.photoTaken ? "yes" : "no"}`
        ]
          .filter(Boolean)
          .join(" · "),
        { size: 9 }
      );
      if (totals.nextMed) line(`Next med due: ${totals.nextMed.time}${totals.nextMed.drug ? ` (${totals.nextMed.drug})` : ""}`, { size: 9 });

      if (dayEntries.length === 0) line("(no entries)", { size: 9 });
      dayEntries.forEach((e) => {
        const cfg = TYPES[e.type];
        const d = e.data || {};
        line(`${e.entry_time}  [${cfg.marker(d, e, null)}]  ${cfg.label}: ${cfg.summary(d, e, null)}${e.note ? ` — ${e.note}` : ""}`, { size: 9 });
      });

      line(
        `TOTALS — Water ${totals.water}/100 oz · Protein ${totals.protein}/100 g · Garment ${(totals.garmentMin / 60).toFixed(1)}h · Movement ${totals.walks} · Sleep+naps ${(totals.sleepH + totals.napH).toFixed(1)}h · Temp PM ${totals.tempPm ?? "—"}`,
        { size: 9, bold: true }
      );
      if (totals.best)
        line(`Best check-in: ${totals.best.slot} (${totals.best.time}) · Worst: ${totals.worst.slot} (${totals.worst.time})`, { size: 9 });

      const answers = day?.red_flag_answers || {};
      const yesKeys = Object.keys(answers).filter((k) => answers[k] === "yes");
      if (Object.keys(answers).length > 0) {
        if (yesKeys.length === 0) line("RED FLAGS — none", { size: 9, bold: true });
        yesKeys.forEach((k) => {
          const det = (day.red_flag_details || {})[k] || {};
          line(`RED FLAG — ${RED_FLAG_ITEMS.find((i) => i.key === k)?.label || k} at ${det.time || "—"}${det.office_called ? " · office called" : ""}`, { size: 9, bold: true });
        });
      }
      (day?.questions || []).forEach((q) => line(`Q for surgeon: ${q}`, { size: 9 }));
      y += 14;
    });

    doc.save(`recovery-log-${from}_to_${to}.pdf`);
    setBusy(false);
    setDone(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Profile</h1>

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Patient</div>
          <div className="text-sm font-semibold break-words">Who this log belongs to.</div>
        </div>
        <div className="p-4">
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3 min-w-0 pb-2">
              <Field label="Patient first name">
                <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} className="nb-input" />
              </Field>
              <Field label="Patient last name">
                <input type="text" value={last} onChange={(e) => setLast(e.target.value)} className="nb-input" />
              </Field>
              <Field label="Date of birth" span hint="care team enter this to join">
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="nb-input" />
              </Field>
              <button
                className="col-span-2 nb-btn w-full h-12 bg-primary text-primary-foreground"
                onClick={savePatient}
                disabled={savingPatient || !first.trim() || !last.trim()}
              >
                {savingPatient ? "Saving…" : "Save patient"}
              </button>
            </div>
          ) : (
            <Row label="Patient" value={displayName(patient)} />
          )}
          <Row label="Signed in as" value={user?.email} />
          <Row label="Your access" value={isOwner ? "Patient — full access" : canWrite ? "Care team — can edit" : "Care team — read only"} />
          <Row label="Procedure" value={surgery?.procedure} />
          <Row label="Surgery date" value={surgery?.surgery_date ? fullDate(surgery.surgery_date) : null} />
          <Row label="Surgeon" value={surgery?.surgeon} />
        </div>
        <div className="px-4 pb-4">
          <button className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {isOwner && (
        <div className="nb-card overflow-hidden">
          <div className="px-4 py-3 border-b-2 bg-muted">
            <div className="font-display text-xl uppercase leading-tight break-words">Care team</div>
            <div className="text-sm font-semibold break-words">
              They sign in with the email you add here, then confirm their date of birth.
            </div>
          </div>

          <div className="p-4 space-y-3">
            {team.length === 0 && <p className="text-sm text-muted-foreground">No one else has access yet.</p>}
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 min-w-0 border-b-2 last:border-b-0 pb-2 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{displayName(m) || m.email}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground truncate">
                    {m.email}{m.can_write === false ? " · read only" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="nb-btn h-11 w-11 shrink-0 bg-card"
                  aria-label={`Remove ${displayName(m) || m.email}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 min-w-0 pt-1">
              <Field label="Their email" span>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="name@example.com"
                  className="nb-input"
                />
              </Field>
              <Field label="Their first name">
                <input
                  type="text"
                  value={invite.first_name}
                  onChange={(e) => setInvite({ ...invite, first_name: e.target.value })}
                  className="nb-input"
                />
              </Field>
              <Field label="Their last name">
                <input
                  type="text"
                  value={invite.last_name}
                  onChange={(e) => setInvite({ ...invite, last_name: e.target.value })}
                  className="nb-input"
                />
              </Field>
              {inviteError && (
                <p className="col-span-2 text-sm font-bold text-destructive break-words">{inviteError}</p>
              )}
              <button
                className="col-span-2 nb-btn w-full h-12 bg-accent text-accent-foreground flex items-center justify-center gap-2"
                onClick={addMember}
              >
                <Plus className="w-4 h-4" />
                Add to care team
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Download a PDF</div>
          <div className="text-sm font-semibold break-words">A day or a range, paper-diary style.</div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 min-w-0">
          <Field label="From">
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="nb-input" />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="nb-input" />
          </Field>

          <p className="col-span-2 text-sm font-semibold text-center break-words">
            {tooWide ? (
              <span className="text-destructive">
                {spanDays} days is over the {MAX_RANGE_DAYS}-day limit — narrow the range.
              </span>
            ) : (
              `${spanDays} day${spanDays === 1 ? "" : "s"} in range`
            )}
          </p>

          <button
            className="col-span-2 nb-btn w-full h-14 bg-primary text-primary-foreground"
            onClick={generate}
            disabled={busy || !from || !to || tooWide}
          >
            {busy ? "Building PDF…" : "Download PDF"}
          </button>
          {done && !busy && <p className="col-span-2 text-sm font-bold text-center">PDF downloaded ✔</p>}
        </div>
      </div>
    </div>
  );
}
