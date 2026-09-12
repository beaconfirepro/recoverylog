/* global __BUILD_COMMIT__, __BUILD_TIME__ */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { usePatient, displayName } from "@/lib/PatientContext";
import { useCareTeam } from "@/lib/careTeam";
import MyLogs from "@/components/legal/MyLogs";
import SignInMethod from "@/components/legal/SignInMethod";
import LegalSection from "@/components/legal/LegalSection";
import DeleteAccount from "@/components/DeleteAccount";
import Field from "@/components/Field";
import { THEMES, TEXT_SIZES, useTheme, useTextSize } from "@/lib/theme";
import { save } from "@/lib/saving";
import { teamCopyError } from "@/lib/saveNotes";

const Row = ({ label, value }) => (
  <div className="flex items-baseline gap-3 py-1.5 border-b-2 last:border-b-0 min-w-0">
    <span className="nb-label shrink-0">{label}</span>
    <span className="flex-1 min-w-0 text-sm font-bold text-right break-words">{value || "—"}</span>
  </div>
);

// Who you are, how you sign in, what you agreed to, and how to leave. Not how
// the app is set up: that is Setup, and it belongs to the log rather than to
// the person reading it.
export default function Me() {
  const { user, logout } = useAuth();
  const { me, patient, isOwner, refreshPatient } = usePatient();
  const { team } = useCareTeam();
  const { theme, choose } = useTheme();
  const { size, choose: chooseSize } = useTextSize();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirst(patient?.first_name || "");
    setLast(patient?.last_name || "");
    setDob(patient?.dob || "");
  }, [patient]);

  const savePatient = async () => {
    setSaving(true);
    const next = { first_name: first.trim(), last_name: last.trim(), dob: dob || null };
    await save(
      async () => {
        await base44.entities.AppUser.update(patient.id, next);
        // Every member row carries a copy of the name so an unopened invitation
        // can say who it is from. The date of birth is not copied: it is not
        // what opens the log any more, and it has no business sitting in a row
        // an invitee can read.
        //
        // allSettled rather than all: a row that will not take must not hide
        // the ones that did, and the half-done case has to be said out loud —
        // her log would say one name while an unopened invitation said another,
        // and the invitee is the one who cannot tell which is right.
        const copies = await Promise.allSettled(
          team.map((m) =>
            base44.entities.AppUser.update(m.id, {
              match_first_name: next.first_name,
              match_last_name: next.last_name
            })
          )
        );
        const failed = copies.filter((c) => c.status === "rejected").length;
        if (failed) throw teamCopyError(failed, copies.length);
      },
      {
        what: "Your details",
        saved: "Your name is updated everywhere it appears.",
        retry: savePatient
      }
    );
    // Read back either way: this is the only thing that says which name is
    // actually stored, and after a half-done save that matters most.
    await refreshPatient();
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl uppercase">You</h1>

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">
            {isOwner ? "You, the patient" : "You"}
          </div>
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
              <Field label="Date of birth" span hint="your care team confirms this to get in">
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="nb-input" />
              </Field>
              <button
                className="col-span-2 nb-btn w-full h-12 bg-primary text-primary-foreground"
                onClick={savePatient}
                disabled={saving || !first.trim() || !last.trim()}
              >
                {saving ? "Saving…" : "Save my details"}
              </button>
            </div>
          ) : (
            <Row label="Your name" value={displayName(me)} />
          )}
          <Row label="Signed in as" value={user?.email} />
          <Row
            label="Your access"
            value={isOwner ? "Patient, full access" : "Care team, read only"}
          />
        </div>
        <div className="px-4 pb-4">
          <button className="nb-btn w-full h-12 bg-card flex items-center justify-center gap-2" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      <MyLogs />

      <div className="nb-card overflow-hidden">
        <div className="px-4 py-3 border-b-2 bg-muted">
          <div className="font-display text-xl uppercase leading-tight break-words">Appearance</div>
          <div className="text-sm font-semibold break-words">How the app looks on this device. Not shared with your care team.</div>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <div className="nb-label">Light or dark</div>
            <div className="flex gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => choose(t)}
                  aria-pressed={theme === t}
                  className="nb-chip flex-1 justify-center capitalize"
                  style={theme === t ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Safari does not pass iOS Dynamic Type through to a web app, so
              turning system text up does nothing here unless the app offers it
              itself. Swelling, painkillers and crying all make near vision
              worse, and this app is read in all three states. */}
          <div className="space-y-1.5">
            <div className="nb-label">Text size</div>
            <div className="flex gap-1.5">
              {TEXT_SIZES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => chooseSize(t.key)}
                  aria-pressed={size === t.key}
                  className="nb-chip flex-1 justify-center"
                  style={size === t.key ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-muted-foreground break-words">
              Changes the whole app on this device, straight away.
            </p>
          </div>
        </div>
      </div>

      <SignInMethod />

      <LegalSection />

      <DeleteAccount isOwner={isOwner} />

      {/* What is actually deployed, for reading off the phone rather than
          trusting the Base44 editor's "last commit". It used to sit under the
          day on Today, where every pixel is meant for the patient rather than
          for whoever is checking a deploy. select-all so one tap copies it. */}
      <p className="pt-2 text-center text-2xs font-mono text-muted-foreground select-all">
        {__BUILD_COMMIT__} · {__BUILD_TIME__.slice(0, 16).replace("T", " ")}Z
      </p>
    </div>
  );
}
