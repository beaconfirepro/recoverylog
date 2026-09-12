// Whether to offer Add to Home Screen, and to whom.
//
// The whole layout is built for standalone: safe-area insets on every bar, a
// fixed tab bar, a translucent status bar. iOS Safari never offers the install
// itself, so most people will only ever see the version with a browser bar
// sitting over the tab bar — which is the layout the safe-area work was done
// to avoid.

export const DISMISSED_KEY = "recoverylog.installHintDismissed";

// navigator.standalone is the iOS-only answer; the media query is what every
// other browser says. Either one being true means she already installed it.
export const isStandalone = (nav = globalThis.navigator, win = globalThis.window) =>
  nav?.standalone === true || win?.matchMedia?.("(display-mode: standalone)")?.matches === true;

// iPhone and iPad, including iPadOS 13 and up, which reports itself as a Mac
// and gives itself away only by having a touch screen.
export const isIos = (nav = globalThis.navigator) => {
  const ua = String(nav?.userAgent ?? "");
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1;
};

// Safari specifically. Chrome and Firefox on iOS cannot add to the home screen
// at all, so telling their users to tap Share would send them looking for a
// menu item that is not there.
export const isIosSafari = (nav = globalThis.navigator) =>
  isIos(nav) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(String(nav?.userAgent ?? ""));

export const shouldOfferInstall = ({ nav, win, dismissed } = {}) =>
  !dismissed && isIosSafari(nav ?? globalThis.navigator) && !isStandalone(nav ?? globalThis.navigator, win ?? globalThis.window);
