import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Users, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, sameEmail } from "@/lib/PatientContext";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Field from "@/components/Field";
import { useCareTeam } from "@/lib/careTeam";
import Surgeries from "@/components/care/Surgeries";

// Set when a log is opened, so a member is asked which patient once a session
// rather than on every navigation. sessionStorage rather than local: a new
// visit should start here, which is the point of the page.
export const PICKED = "recoverylog.pickedPatient";
export const markPicked = () => {
  try {
    window.sessionStorage.setItem(PICKED, "1");
  } catch {
    // A browser refusing storage just sees this page more often.
  }
};
export const hasPicked = () => {
  try {
    return window.sessionStorage.getItem(PICKED) === "1";
  } catch {
    return false;
  }
};

const nameOf = (row) =>
  [row.match_first_name, row.match_last_name].filter(Boolean).join(" ").trim() || "This patient";

// An invitation you have not opened yet shows enough to recognise the one you
// were expecting, and not enough to learn a name and a date of birth from an
// email you should not have. First initial, the last name's first and last
// letter, and the year's last two digits: "D. D___e · ··/··/74".
const maskedName = (row) => {
  const first = String(row.match_first_name ?? "").trim();
  const last = String(row.match_last_name ?? "").trim();
  const initial = first ? `${first[0].toUpperCase()}.` : "";
  // A two-letter surname would otherwise print in full, which is the whole
  // name given away.
  const surname =
    last.length > 2
      ? `${last[0]}${"_".repeat(last.length - 2)}${last[last.length - 1]}`
      : last.length === 2
        ? `${last[0]}_`
        : last;
  return [initial, surname].filter(Boolean).join(" ") || "A patient";
};

const maskedDob = (row) => {
  const dob = String(row.match_dob ?? "").trim();
  // Stored as YYYY-MM-DD. Only the last two digits of the year survive.
  return dob.length >= 4 ? `··/··/${dob.slice(2, 4)}` : "";
};

function Claim({ row, onDone, onCancel }) {
  const { claimMembership } = usePatient();
  const [form, setForm] = useState({ first_name: "", last_name: "", dob: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = form.first_name.trim() && form.last_name.trim() && form.dob;

  const submit = async () => {
    setBusy(true);
    setError("");
    const ok = await claimMembership(row, form);
    if (!ok) {
      setError("Those details don't match the invitation. Check the spelling and the date of birth with the patient.");
      setBusy(false);
      return;
    }
    markPicked();
    onDone();
  };

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError("");
  };

  return (
    <div className="border-2 rounded-xl bg-background p-3 space-y-3">
      <p className="text-sm font-semibold break-words">
        Enter the patient's details to open their log.
      </p>
      <div className="grid grid-cols-2 gap-3 min-w-0">
        <Field label="Patient first name">
          <input type="text" value={form.first_name} onChange={set("first_name")} className="nb-input" />
        </Field>
        <Field label="Patient last name">
          <input type="text" value={form.last_name} onChange={set("last_name")} className="nb-input" />
        </Field>
        <Field label="Patient date of birth" span>
          <input type="date" value={form.dob} onChange={set("dob")} className="nb-input" />
        </Field>
      </div>
      {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}
      <div className="flex gap-2 min-w-0">
        <button
          className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground disabled:opacity-40"
          onClick={submit}
          disabled={busy || !ready}
        >
          {busy ? "Checking…" : "Open the log"}
        </button>
        <button className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// Adding someone is a small form, so it opens over the list rather than sending
// you to another page to do it.
function AddMember({ patient, patientId, team, onDone, onCancel }) {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setError("");
  };

  const submit = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !form.first_name.trim() || !form.last_name.trim()) {
      setError("Email, first name and last name are all needed.");
      return;
    }
    if (team.some((m) => sameEmail(m.email, email))) {
      setError("That email is already on the care team.");
      return;
    }
    setBusy(true);
    await base44.entities.AppUser.create({
      patient_id: patientId,
      kind: "team_member",
      email,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      // Copied onto their row so they can match against it. Row security does
      // not let an unlinked account read the patient's own row.
      match_first_name: patient?.first_name || "",
      match_last_name: patient?.last_name || "",
      match_dob: patient?.dob || null
    });
    setBusy(false);
    onDone();
  };

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h2 className="font-display text-xl uppercase leading-tight break-words">Add to care team</h2>
        <p className="text-sm font-semibold break-words">
          They sign in with this email, then confirm your name and date of birth.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 min-w-0">
        <Field label="Their email" span>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="name@example.com"
            className="nb-input"
          />
        </Field>
        <Field label="Their first name">
          <input type="text" value={form.first_name} onChange={set("first_name")} className="nb-input" />
        </Field>
        <Field label="Their last name">
          <input type="text" value={form.last_name} onChange={set("last_name")} className="nb-input" />
        </Field>
      </div>

      {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}

      <div className="flex gap-2 min-w-0">
        <button
          type="button"
          className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground"
          onClick={submit}
          disabled={busy}
        >
          {busy ? "Adding…" : "Add them"}
        </button>
        <button type="button" className="nb-btn h-12 px-4 shrink-0 bg-card" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// Where a care team member starts: the logs they have opened before, and the
// invites they have not. Everything else in the app is one patient's log, so
// this is the only screen that shows more than one.
export default function Care() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { me, patient, patientId, groups, isOwner, switchPatient } = usePatient();
  const { team, reload: loadTeam } = useCareTeam();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [busy, setBusy] = useState(false);

  const teams = groups.filter((g) => !g.own);
  const opened = teams.filter((g) => g.row.claimed_at);
  const invites = teams.filter((g) => !g.row.claimed_at);

  const open = async (g) => {
    setBusy(true);
    markPicked();
    await switchPatient(g.id);
    navigate("/");
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">Care</h1>

      {(teams.length > 0 || !isOwner) && (
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <Users className="w-5 h-5 shrink-0" /> Logs you help with
          </div>
          <div className="text-sm font-semibold break-words">
            {opened.length === 0 ? "None opened yet." : `${opened.length} opened.`}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {opened.map((g) => (
            <button
              key={g.row.id}
              type="button"
              disabled={busy}
              onClick={() => open(g)}
              className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
            >
              <span className="flex-1 min-w-0">
                <span className="block nb-label truncate">{nameOf(g.row)}</span>
                <span className="block text-xs font-semibold text-muted-foreground truncate">Read only</span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </button>
          ))}

          {invites.length > 0 && (
            <div className="pt-1 space-y-2">
              <div className="nb-label text-muted-foreground">Invitations</div>
              {invites.map((g) =>
                claiming === g.row.id ? (
                  <Claim
                    key={g.row.id}
                    row={g.row}
                    onDone={() => navigate("/")}
                    onCancel={() => setClaiming(null)}
                  />
                ) : (
                  <button
                    key={g.row.id}
                    type="button"
                    onClick={() => setClaiming(g.row.id)}
                    className="w-full text-left border-2 rounded-xl bg-background p-3 flex items-center gap-2 min-w-0"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block nb-label truncate">
                        {maskedName(g.row)}
                        {maskedDob(g.row) ? ` · ${maskedDob(g.row)}` : ""}
                      </span>
                      <span className="block text-xs font-semibold text-muted-foreground break-words">
                        Confirm the patient's name and date of birth to open it
                      </span>
                    </span>
                    <ChevronRight className="w-5 h-5 shrink-0" />
                  </button>
                )
              )}
            </div>
          )}

          {teams.length === 0 && (
            <p className="text-sm text-muted-foreground break-words">
              No invitations yet. A patient adds {user?.email} to their care team, and it appears here.
            </p>
          )}
        </div>
      </div>

      )}

      {/* Where the care team is managed. It is not in Setup: Setup is how the
          log is configured, and this is who can see it. */}
      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words flex items-center gap-2">
            <Users className="w-5 h-5 shrink-0" /> Care team
          </div>
          <div className="text-sm font-semibold break-words">
            {isOwner
              ? "They sign in with this email, confirm your name and date of birth, and can read your log."
              : `Who else helps ${displayName(patient) || "this patient"}.`}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {team.length === 0 && (
            <p className="text-sm text-muted-foreground break-words">
              {isOwner
                ? "Nobody else can see this log. Add someone and they get in once they confirm your name and date of birth."
                : "Nobody else is on this care team."}
            </p>
          )}

          {team.map((m) => (
            <div key={m.id} className="min-w-0 border-b-2 last:border-b-0 pb-3 last:pb-0 space-y-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{displayName(m) || m.email}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground truncate">{m.email}</div>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setRemoving(m.id)}
                    className="nb-btn h-11 w-11 shrink-0 bg-card"
                    aria-label={`Remove ${displayName(m) || m.email}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Taking someone off ends their access to the whole log, so it
                  asks, the way leaving a team does. */}
              {removing === m.id && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold break-words">
                    {displayName(m) || m.email} loses access to your log straight away. You can add them again
                    later.
                  </p>
                  <div className="flex gap-2 min-w-0">
                    <button
                      type="button"
                      className="nb-btn flex-1 min-w-0 h-11 bg-destructive text-destructive-foreground"
                      onClick={async () => {
                        await base44.entities.AppUser.delete(m.id);
                        setRemoving(null);
                        loadTeam();
                      }}
                    >
                      Remove for good
                    </button>
                    <button
                      type="button"
                      className="nb-btn h-11 px-4 shrink-0 bg-card"
                      onClick={() => setRemoving(null)}
                    >
                      Keep them
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isOwner && (
            <button
              type="button"
              className="nb-btn w-full h-12 bg-accent text-accent-foreground flex items-center justify-center gap-2"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-4 h-4" /> Add someone
            </button>
          )}
        </div>
      </div>

      <Surgeries />

      <Dialog open={adding} onOpenChange={(o) => !o && setAdding(false)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {adding && (
            <AddMember
              patient={patient}
              patientId={patientId}
              team={team}
              onDone={() => {
                setAdding(false);
                loadTeam();
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
