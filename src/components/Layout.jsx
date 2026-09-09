import React, { useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, History as HistoryIcon, SlidersHorizontal, TrendingUp, UserRound, Users } from "lucide-react";
import { usePatient, displayName } from "@/lib/PatientContext";

const NAV = [
  { to: "/", label: "Today", icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/day") },
  { to: "/history", label: "History", icon: HistoryIcon, match: (p) => p.startsWith("/history") },
  { to: "/trends", label: "Trends", icon: TrendingUp, match: (p) => p.startsWith("/trends") },
  // Care holds both lists: who is on the team, and the surgeries.
  { to: "/care", label: "Care", icon: Users, match: (p) => p.startsWith("/care") },
  // Setup is how the log is configured. Who you are lives behind the button
  // in the header, because it is about the person rather than the log.
  { to: "/profile", label: "Setup", icon: SlidersHorizontal, match: (p) => p.startsWith("/profile") }
];

// A tab keeps where you left it. Coming back to History and landing at the top
// of a hundred days is the same as losing your place.
const useTabScroll = (pathname) => {
  const positions = useRef({});
  const last = useRef(pathname);
  useEffect(() => {
    positions.current[last.current] = window.scrollY;
    last.current = pathname;
    const y = positions.current[pathname];
    if (y) window.scrollTo({ top: y, behavior: "instant" });
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

  return (
    <div className="min-h-screen">
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
            <span className="text-[10px] font-body opacity-60 truncate">{greeting}</span>
          ) : (
            // A care-team member can be in more than one person's log. Whose it
            // is has to be on screen, not something they infer.
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-heading uppercase tracking-wider opacity-60 shrink-0">Viewing</span>
              <span
                className="text-[10px] font-heading uppercase tracking-wide truncate px-1.5 py-0.5 rounded"
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
                <span className="font-heading text-[10px] uppercase tracking-wide">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
