import React, { useEffect, useRef, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, History as HistoryIcon, SlidersHorizontal, TrendingUp, UserRound, Users } from "lucide-react";
import { usePatient, displayName } from "@/lib/PatientContext";
import { announceNow, currentAnnouncements, subscribeAnnouncements } from "@/lib/announce";
import { RESTORE_TIMEOUT_MS, canRestore, worthRestoring } from "@/lib/tabScroll";
import { useOffline } from "@/lib/offline";

const NAV = [
  { to: "/", label: "Today", icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/day") },
  // "Day by Day" rather than "History": it is her own week, not an archive.
  // At 375pt each of the five tabs gets 75px and the label measures about
  // 59px in Outfit 800 at 10px, so it holds one line — and if a wider font
  // ever pushes it to two, icon and two 10px lines still sit inside h-16.
  { to: "/history", label: "Day by Day", icon: HistoryIcon, match: (p) => p.startsWith("/history") },
  { to: "/trends", label: "Trends", icon: TrendingUp, match: (p) => p.startsWith("/trends") },
  // Care is people: the team, and the logs she helps with. The records
  // themselves live in Setup, next to the settings that configure them.
  { to: "/care", label: "Care", icon: Users, match: (p) => p.startsWith("/care") },
  // Setup is how the log is configured. Who you are lives behind the button
  // in the header, because it is about the person rather than the log.
  { to: "/profile", label: "Setup", icon: SlidersHorizontal, match: (p) => p.startsWith("/profile") }
];

// A tab keeps where you left it. Coming back to Day by Day and landing at the
// top of a hundred days is the same as losing your place.
//
// The catch is that the destination is still a spinner at the moment the
// pathname changes, so the document is one viewport tall and the browser
// clamps any restore to roughly zero — which is why this never worked. The
// position is held until the page is tall enough to hold it, and a resize
// observer is what says when that is.
const useTabScroll = (pathname) => {
  const positions = useRef({});
  const last = useRef(pathname);

  useEffect(() => {
    positions.current[last.current] = window.scrollY;
    last.current = pathname;

    const target = positions.current[pathname];
    if (!worthRestoring(target)) return undefined;

    let done = false;
    const attempt = () => {
      if (done) return;
      if (!canRestore(target, document.documentElement.scrollHeight, window.innerHeight)) return;
      done = true;
      window.scrollTo({ top: target, behavior: "instant" });
      stop();
    };

    // The page may already be tall enough — a cached tab, or one that renders
    // from state it still had.
    attempt();

    const observer = new ResizeObserver(attempt);
    observer.observe(document.documentElement);
    // A read that is still going after this has gone wrong, and scrolling a
    // half-drawn page is worse than leaving it at the top.
    const timer = setTimeout(() => {
      done = true;
      stop();
    }, RESTORE_TIMEOUT_MS);

    function stop() {
      observer.disconnect();
      clearTimeout(timer);
    }
    return stop;
  }, [pathname]);
};

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { patient, isOwner } = usePatient();
  const who = displayName(patient);
  // Her own log greets her. A blank name would leave "Hi !", so it says nothing
  // rather than something half-written.
  const greeting = patient?.first_name ? `Hi ${patient.first_name}!` : "";
  useTabScroll(pathname);
  const offline = useOffline();

  // What the app just did, in words, for a screen reader that was told none of
  // it before. Anything in the tree can write here through @/lib/announce. A
  // toast says its own text out loud as it appears, so saves and failures
  // announce themselves and are deliberately not repeated here; this carries
  // what no toast covers — the log switch below, and a success that confirms
  // itself on the page rather than in a toast.
  const [live, setLive] = useState(currentAnnouncements);
  useEffect(() => subscribeAnnouncements(setLive), []);

  // Whose medical record is on screen is the one announcement that interrupts.
  // switchPatient lives in PatientContext, which this file does not touch, so
  // the switch is read off the patient changing underneath the header — which
  // is exactly the moment the record on screen changed. The first log to arrive
  // is not a switch, so nothing is said about it.
  const announced = useRef(null);
  useEffect(() => {
    const id = patient?.id || null;
    if (!id) return;
    const before = announced.current;
    announced.current = id;
    if (before && before !== id) {
      announceNow(`Now viewing ${who || "an unnamed patient"}'s log.`);
    }
    // `who` is read, not watched: a rename is not a switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  return (
    <div className="min-h-screen">
      {/* Two regions, because they are read differently: the polite one waits
          its turn, the assertive one cuts in. aria-atomic so the whole sentence
          is read rather than the words that changed in it. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {live.polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {live.assertive}
      </div>
      {/* Sticky rather than scrolled away: the bar carries whose log this is,
          which a care-team member needs at any point down a long day. */}
      <header
        className="sticky top-0 z-30 border-b-2 bg-foreground text-background"
        style={{ paddingTop: "var(--safe-t)" }}
      >
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <span className="font-display uppercase tracking-widest text-sm shrink-0">LipNode</span>
          <span className="flex items-center gap-2 min-w-0">
          {isOwner ? (
            <span className="text-2xs font-body opacity-60 truncate">{greeting}</span>
          ) : (
            // A care-team member can be in more than one person's log. Whose it
            // is has to be on screen, not something they infer.
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-heading uppercase tracking-wider opacity-70 shrink-0">Viewing</span>
              <span
                className="text-xs font-heading uppercase tracking-wide truncate px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))" }}
              >
                {who || "unnamed patient"}
              </span>
            </span>
          )}
          <Link
            to="/me"
            aria-label="You"
            aria-current={pathname.startsWith("/me") ? "page" : undefined}
            className="shrink-0 flex items-center justify-center w-8 h-8 border-2 rounded-lg"
            style={
              pathname.startsWith("/me")
                ? { backgroundColor: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--background))" }
                : { borderColor: "hsl(var(--background))" }
            }
          >
            <UserRound className="w-4 h-4" />
          </Link>
          </span>
        </div>
      </header>

      {/* Said once, at the top, rather than left for her to infer from a save
          that did not land. The app still tries every write — this explains a
          failure, it does not pre-empt one. */}
      {offline && (
        <div
          role="status"
          className="sticky z-20 border-b-2 px-4 py-1.5 text-center text-2xs font-heading uppercase tracking-wider"
          style={{
            top: "calc(var(--safe-t) + 3.375rem)",
            backgroundColor: "hsl(var(--destructive))",
            color: "hsl(var(--destructive-foreground))"
          }}
        >
          No connection — anything you log now may not save
        </div>
      )}

      <main
        key={pathname}
        className="max-w-lg mx-auto px-3 py-4 animate-page"
        style={{
          // Nothing inside the page can paint over the bars. Without this the
          // timeline's plates, which sit at z-10 to cross the rail, outrank a
          // bar that is only pinned there, and the day runs over the tabs.
          isolation: "isolate",
          paddingBottom: "calc(7rem + var(--safe-b))",
          paddingLeft: "max(0.75rem, var(--safe-l))",
          paddingRight: "max(0.75rem, var(--safe-r))"
        }}
      >
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t-2 bg-foreground"
        style={{ paddingBottom: "var(--safe-b)" }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.match(pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
                // Tapping the tab you are on goes back to its root without
                // stacking another copy of it behind the back gesture.
                replace={active}
                onClick={(e) => {
                  if (active && pathname !== n.to) {
                    e.preventDefault();
                    navigate(n.to, { replace: true });
                  }
                }}
                aria-current={active ? "page" : undefined}
                className="h-16 flex flex-col items-center justify-center gap-1"
                style={active ? { backgroundColor: "hsl(var(--primary))", color: "#fff" } : { color: "hsl(var(--background))" }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-heading text-2xs uppercase tracking-wide">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
