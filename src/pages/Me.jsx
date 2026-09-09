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
import { THEMES, useTheme } from "@/lib/theme";

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
    await base44.entities.AppUser.update(patient.id, next);
    // Every member row carries a copy of these to match against, so they move
    // with it. Otherwise a name change would lock the care team out.
    await Promise.all(
      team.map((m) =>
        base44.entities.AppUser.update(m.id, {
          match_first_name: next.first_name,
          match_last_name: next.last_name,
          match_dob: next.dob
        })
      )
    );
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
          <div className="text-sm font-semibold break-words">How the app looks on this device.</div>
        </div>
        <div className="p-4 flex gap-1.5">
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

      <SignInMethod />

      <LegalSection />

      <DeleteAccount isOwner={isOwner} />
    </div>
  );
}
