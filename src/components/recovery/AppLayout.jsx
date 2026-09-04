import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, ListOrdered, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/', label: 'Today', icon: CalendarDays, match: (p) => p === '/' || p.startsWith('/day/') },
    { to: '/history', label: 'History', icon: ListOrdered, match: (p) => p.startsWith('/history') },
    { to: '/trends', label: 'Trends', icon: TrendingUp, match: (p) => p.startsWith('/trends') },
  ];
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen bg-background flex flex-col">
        <main className="flex-1 px-4 pt-5 pb-28">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-md grid grid-cols-3">
            {tabs.map((t) => {
              const active = t.match(pathname);
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn('flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition', active ? 'text-primary' : 'text-muted-foreground')}
                >
                  <Icon className={cn('w-6 h-6', active && 'scale-110')} />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}