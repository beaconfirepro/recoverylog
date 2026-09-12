import React, { useState } from "react";
import { Share, X } from "lucide-react";
import { DISMISSED_KEY, shouldOfferInstall } from "@/lib/install";

const wasDismissed = () => {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

// Instructions rather than a button, because iOS is the one platform where the
// install cannot be triggered from the page. Every other browser fires
// beforeinstallprompt and could have a real button; iPhone users have to be
// told where to look.
export default function InstallHint() {
  const [gone, setGone] = useState(() => !shouldOfferInstall({ dismissed: wasDismissed() }));
  if (gone) return null;

  const dismiss = () => {
    setGone(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Storage blocked. She sees this again, which is a nuisance rather than
      // a fault.
    }
  };

  return (
    <div className="nb-card p-4 flex items-start gap-3 min-w-0">
      <Share className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-bold break-words">Add LipNode to your home screen</p>
        <p className="text-sm font-semibold text-muted-foreground break-words">
          Tap the Share button, then Add to Home Screen. It opens full screen, without the browser bar over the
          tabs.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide this"
        className="w-11 h-11 -m-2 shrink-0 grid place-items-center text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
