import React from "react";

// A phone bezel wrapping a mockup of an app screen. Used on the splash page to
// show what the log looks like without shipping real screenshots.
export default function PhoneFrame({ children, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[260px] rounded-[2rem] border-2 bg-foreground p-1.5 shadow-[6px_6px_0_hsl(var(--foreground))]">
        <div className="rounded-[1.6rem] overflow-hidden bg-background border-2 border-foreground">
          <div className="flex justify-center pt-1.5">
            <div className="h-1.5 w-12 rounded-full bg-foreground/30" />
          </div>
          <div className="px-2 pb-2 pt-1">{children}</div>
        </div>
      </div>
      {label && (
        <p className="mt-3 text-center font-heading text-xs uppercase tracking-wide">{label}</p>
      )}
    </div>
  );
}