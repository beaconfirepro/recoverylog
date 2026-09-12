/* global self, caches, Response */

// Opening the app without signal used to show a spinner for ever. The whole
// layout is built for an installed app — safe-area insets, a fixed tab bar —
// and an installed app that will not open off a bad connection is worse than a
// web page, because a web page at least says it could not connect.
//
// This caches the shell so the app opens. It does not cache the log: entries,
// days and surgeries are read live and are never served stale, because a stale
// medical record is worse than no record. What she gets offline is an app that
// opens and tells her the truth about the connection.
//
// A service worker that gets this wrong can pin a broken build on a device for
// good, so the rules here are deliberately narrow.

const SHELL = "lipnode-shell-v1";
const ASSETS = "lipnode-assets-v1";
const MINE = [SHELL, ASSETS];

// Everything needed to paint something. index.html is fetched fresh whenever
// the network allows, so this copy is only ever the offline fallback.
const SHELL_URLS = ["/", "/index.html", "/manifest.json", "/apple-touch-icon.png", "/icon-192.png"];

// A build leaves its old hashed files behind. Harmless, but not for ever.
const MAX_ASSETS = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // addAll fails the whole install if any one URL 404s, which would leave
      // no worker at all. Each is added on its own so a missing icon cannot
      // cost the shell.
      .then((cache) => Promise.all(SHELL_URLS.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !MINE.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const trim = async () => {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  // Oldest first, which is insertion order here.
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)));
};

// Content-hashed by the build, so a cached copy can only ever be the right one
// for that filename. A new deploy asks for new names.
const isBuiltAsset = (url) => url.pathname.startsWith("/assets/");

const isShellFile = (url) => SHELL_URLS.includes(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Anything not served by this app — the SDK's calls, the medicine name
  // lookup, fonts — is left entirely alone. Nothing about the log is cached.
  if (url.origin !== self.location.origin) return;

  // A page load. Network first, so a new build is picked up the moment there is
  // a connection; the cached shell is only what stops a blank screen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(async () => (await caches.match("/index.html")) || Response.error())
    );
    return;
  }

  if (isBuiltAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(request, copy).then(trim));
            }
            return res;
          })
      )
    );
    return;
  }

  if (isShellFile(url)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
    return;
  }

  // Everything else, including every call that reads or writes the log, goes
  // to the network and nowhere else.
});
