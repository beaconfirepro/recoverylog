import { useEffect, useState } from "react";

// navigator.onLine is a low bar — it says the device has a network interface,
// not that anything is reachable — so it is only ever used to explain a failure
// that already happened, never to decide whether to try. A save is always
// attempted; this says why it did not land.
export const isOffline = (nav = globalThis.navigator) => nav?.onLine === false;

export function useOffline() {
  const [offline, setOffline] = useState(() => isOffline());

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    // The events can have fired before this mounted.
    setOffline(isOffline());
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return offline;
}

// Registered only in a real build. Under `base44 dev` the served bundle changes
// every save, and a worker caching hashed assets there is a way to spend an
// afternoon looking at yesterday's code.
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // No worker means no offline shell, which is where the app was before
      // this existed. Nothing to tell her about.
    });
  });
};
