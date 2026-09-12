import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Mail, Plus, Users, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName, sameEmail } from "@/lib/PatientContext";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Field from "@/components/Field";
import { useCareTeam } from "@/lib/careTeam";
import { maskedName } from "@/lib/invite";
import { formatJoinCode, generateJoinCode } from "@/lib/joinCode";
import { sendInviteEmail } from "@/lib/inviteEmail";
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

function Claim({ row, onDone, onCancel }) {
  const { claimMembership } = usePatient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    const ok = await claimMembership(row, code);
    if (!ok) {
      setError("That code doesn't match this invitation. Ask the patient to read it out again.");
      setBusy(false);
      return;
    }
    markPicked();
    onDone();
  };

  return (
    <div className="border-2 rounded-xl bg-background p-3 space-y-3">
      <p className="text-sm font-semibold break-words">
        Enter the join code the patient gave you.
      </p>
      <Field label="Join code">
        <input
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          placeholder="7K2-QM4"
          className="nb-input tracking-[0.3em] text-center uppercase"
        />
      </Field>
      {error && <p className="text-sm font-bold text-destructive break-words">{error}</p>}
      <div className="flex gap-2 min-w-0">
        <button
          className="nb-btn flex-1 min-w-0 h-12 bg-primary text-primary-foreground disabled:opacity-40"
          onClick={submit}
          disabled={busy || !code.trim()}
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
  // Shown after the row is written, because the patient has to read it out and
  // this is the moment she has the person in mind.
  const [added, setAdded] = useState(null);

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
    const join_code = generateJoinCode();
    await base44.entities.AppUser.create({
      patient_id: patientId,
      kind: "team_member",
      email,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      join_code,
      // Copied onto their row so an unopened invitation can say who it is from.
      // Row security does not let an unlinked account read the patient's own
      // row.
      match_first_name: patient?.first_name || "",
      match_last_name: patient?.last_name || ""
    });
    // The invitation tells them it exists and where to go. The code is not in
    // it: the patient reads that out. A failed send is worth saying so, because
    // the code alone is no use to someone who was never told to look.
    try {
      await sendInviteEmail({
        to: email,
        memberFirstName: form.first_name.trim(),
        patientName: displayName(patient) || "A patient",
        appUrl: window.location.origin
      });
      setAdded({ code: join_code, emailed: true, email });
    } catch {
      setAdded({ code: join_code, emailed: false, email });
    }
    setBusy(false);
  };

  if (added) {
    return (
      <div className="min-w-0 space-y-3">
        <div>
          <h2 className="font-display text-xl uppercase leading-tight break-words">Read them this code</h2>
          <p className="text-sm font-semibold break-words">
            {added.emailed
              ? `${added.email} has been sent an invitation. It does not contain the code.`
              : `The invitation email to ${added.email} did not send. Tell them to sign in at this address.`}
          </p>
        </div>

        <div className="border-2 rounded-xl bg-muted p-4 text-center">
          <div className="font-display text-4xl tracking-[0.2em] break-words">{formatJoinCode(added.code)}</div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground break-words">
          Text it, say it, write it down. Without it nothing opens, so anyone who receives the email by mistake
          still cannot see your log. It stays on the care team list until they use it.
        </p>

        <button type="button" className="nb-btn w-full h-12 bg-primary text-primary-foreground" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h2 className="font-display text-xl uppercase leading-tight break-words">Add to care team</h2>
        <p className="text-sm font-semibold break-words">
          They get an invitation at this address. You get a code to read out to them.
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

// An invitation that has not been opened yet. The code is the patient's to hand
// out, so she can read it back at any time; the email can be sent again for
// someone who lost it or never saw it.
function PendingInvite({ member, patient }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    setSent(false);
    try {
      await sendInviteEmail({
        to: member.email,
        memberFirstName: member.first_name || "",
        patientName: displayName(patient) || "A patient",
        appUrl: window.location.origin
      });
      setSent(true);
    } catch {
      setSent(false);
    }
    setSending(false);
  };

  return (
    <div className="border-2 rounded-xl bg-muted p-3 space-y-2 min-w-0">
      <div className="nb-label text-muted-foreground">Not opened yet</div>
      {member.join_code ? (
        <>
          <div className="font-display text-2xl tracking-[0.2em] break-words">{formatJoinCode(member.join_code)}</div>
          <p className="text-xs font-semibold text-muted-foreground break-words">
            Read this out to them. It is not in the invitation email.
          </p>
        </>
      ) : (
        <p className="text-xs font-semibold break-words">
          This invitation was made before join codes, so it has no code and cannot be opened. Remove them and add
          them again.
        </p>
      )}
      <button
        type="button"
        className="nb-btn w-full h-11 bg-card flex items-center justify-center gap-2"
        onClick={resend}
        disabled={sending}
      >
        <Mail className="w-4 h-4 shrink-0" />
        {sending ? "Sending…" : sent ? "Sent again" : "Send the invitation again"}
      </button>
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
                      </span>
                      <span className="block text-xs font-semibold text-muted-foreground break-words">
                        Enter the join code they gave you to open it
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
              ? "They sign in with this email, enter the code you read out to them, and can read your log."
              : `Who else helps ${displayName(patient) || "this patient"}.`}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {team.length === 0 && (
            <p className="text-sm text-muted-foreground break-words">
              {isOwner
                ? "Nobody else can see this log. Add someone and they get in with a code you read out to them."
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
                {m.claimed_at && <Check className="w-4 h-4 shrink-0 text-muted-foreground" aria-label="Has opened your log" />}
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

              {/* Until they use it, the code is the only thing standing between
                  the invitation and the log, so the patient can always read it
                  back rather than starting again. */}
              {isOwner && !m.claimed_at && <PendingInvite member={m} patient={patient} />}

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
