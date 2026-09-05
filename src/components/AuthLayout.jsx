import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md min-w-0">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 border-2 rounded-2xl bg-primary mb-4">
            <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="font-display text-3xl uppercase tracking-tight text-foreground break-words">{title}</h1>
          {subtitle && <p className="text-sm font-semibold text-muted-foreground mt-2 break-words">{subtitle}</p>}
        </div>
        <div className="nb-card p-6 min-w-0">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
