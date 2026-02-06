// Service Worker for Terrarium deployed under /terraria/

const CACHE_NAME = "terrarium-v1";

// --- Fetch handler ---
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        // Flush cache if root page is requested
        if (new URL(event.request.url).pathname.endsWith("/")) {
          await maybeFlushCache();
        }

        // Return cached response if available
        let cached = await caches.match(event.request);
        if (cached) {
          const headers = new Headers(cached.headers);
          if (headers.get("Cross-Origin-Embedder-Policy") !== "require-corp")
            headers.append("Cross-Origin-Embedder-Policy", "require-corp");
          if (headers.get("Cross-Origin-Opener-Policy") !== "same-origin")
            headers.append("Cross-Origin-Opener-Policy", "same-origin");

          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: headers,
          });
        }

        // Otherwise fetch from network
        return fetch(event.request);
      } catch (e) {
        console.error("SW fetch error", e);
        return new Response("Worker error", { status: 500, statusText: "Network error" });
      }
    })()
  );
});

// --- Cache installation ---
self.addEventListener("install", (event) => {
  event.waitUntil(installCache());
});

async function installCache() {
  const cache = await caches.open(CACHE_NAME);

  // Fetch boot JSON for Blazor resources
  const bootResponse = await fetch("./_framework/blazor.boot.json");
  const bootJson = await bootResponse.json();

  // List of resources to cache (relative to sw.js location)
  const resources = [
    "./", // index.html
    "./MILESTONE",
    "./_framework/blazor.boot.json",
    "./app.ico",
    "./backdrop.png",
    "./AndyBold.ttf",
    "./assets/index.js",
    "./assets/index.css",
    ...Object.keys(bootJson.resources.fingerprinting).map((r) => "./_framework/" + r),
  ];

  await cache.addAll(resources);
  console.log("SW cache installed", resources);
}

// --- Cache flush if MILESTONE changes ---
async function maybeFlushCache() {
  try {
    const cached = await caches.match("./MILESTONE");
    const response = await fetch("./MILESTONE");
    const milestoneText = await response.text();

    if (cached) {
      const cachedText = await cached.text();
      if (cachedText === milestoneText) {
        console.log("Cache is up-to-date");
        return;
      }
    }

    // Flush all caches
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    console.log("Cache flushed due to new MILESTONE");
  } catch (e) {
    console.error("SW maybeFlushCache error", e);
  }
}

// --- Activate handler ---
self.addEventListener("activate", (event) => {
  event.waitUntil(maybeFlushCache());
  console.log("SW activated");
});
