// Service Worker for Terrarium (/.terraria/)
// Safe for .NET WASM threading + SharedArrayBuffer

const CACHE_NAME = "terrarium-v2";

// -------------------- FETCH --------------------
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      let response;

      try {
        response =
          (await caches.match(event.request)) ||
          (await fetch(event.request));
      } catch (e) {
        return new Response("Network error", { status: 500 });
      }

      // Always SET (never append) isolation headers
      const headers = new Headers(response.headers);
      headers.set("Cross-Origin-Opener-Policy", "same-origin");
      headers.set("Cross-Origin-Embedder-Policy", "require-corp");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    })()
  );
});

// -------------------- INSTALL --------------------
self.addEventListener("install", (event) => {
  event.waitUntil(installCache());
  self.skipWaiting();
});

async function installCache() {
  const cache = await caches.open(CACHE_NAME);

  const bootResponse = await fetch("./_framework/blazor.boot.json");
  const bootJson = await bootResponse.json();

  const resources = [
    "./",
    "./MILESTONE",
    "./_framework/blazor.boot.json",
    "./app.ico",
    "./backdrop.png",
    "./AndyBold.ttf",
    "./assets/index.js",
    "./assets/index.css",
    ...Object.keys(bootJson.resources.fingerprinting).map(
      (r) => "./_framework/" + r
    ),
  ];

  await cache.addAll(resources);
  console.log("[SW] Cache installed");
}

// -------------------- ACTIVATE --------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      );
      await maybeFlushCache();
      await self.clients.claim();
      console.log("[SW] Activated");
    })()
  );
});

// -------------------- CACHE INVALIDATION --------------------
async function maybeFlushCache() {
  try {
    const cached = await caches.match("./MILESTONE");
    const response = await fetch("./MILESTONE");
    const text = await response.text();

    if (cached) {
      const cachedText = await cached.text();
      if (cachedText === text) {
        console.log("[SW] Cache up-to-date");
        return;
      }
    }

    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log("[SW] Cache flushed (new milestone)");
  } catch (e) {
    console.warn("[SW] Cache check failed", e);
  }
}
