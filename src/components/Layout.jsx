import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { CalendarDays, History as HistoryIcon, TrendingUp, UserRound, Scissors } from "lucide-react";
import { usePatient, displayName } from "@/lib/PatientContext";

const NAV = [
  { to: "/", label: "Today", icon: CalendarDays, match: (p) => p === "/" || p.startsWith("/day") },
  { to: "/history", label: "History", icon: HistoryIcon, match: (p) => p.startsWith("/history") },
  { to: "/trends", label: "Trends", icon: TrendingUp, match: (p) => p.startsWith("/trends") },
  { to: "/surgery", label: "Surgery", icon: Scissors, match: (p) => p.startsWith("/surgery") },
  { to: "/profile", label: "Profile", icon: UserRound, match: (p) => p.startsWith("/profile") }
];

export default function Layout() {
  const { pathname } = useLocation();
  const { patient, isOwner } = usePatient();
  const who = displayName(patient);
  return (
    <div className="min-h-screen">
      <header className="border-b-2 bg-foreground text-background">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <span className="font-display uppercase tracking-widest text-sm shrink-0">Recovery Log</span>
          {isOwner ? (
            <span className="text-[10px] font-body opacity-60">one day at a time</span>
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
        </div>
      </header>
      <main className="max-w-lg mx-auto px-3 py-4 pb-28">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 border-t-2 bg-foreground">
        <div className="max-w-lg mx-auto grid grid-cols-5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = n.match(pathname);
            return (
              <Link
                key={n.to}
                to={n.to}
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
