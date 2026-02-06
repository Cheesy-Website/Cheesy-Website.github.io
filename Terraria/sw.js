// Service Worker for Terrarium (.NET WASM SAFE)

const CACHE_NAME = "terrarium-static-v1";

// Files that MUST NEVER be intercepted (threading-critical)
const PASSTHROUGH = [
  "/_framework/",
  ".wasm",
  "dotnet.js",
  "dotnet.runtime",
  "dotnet.native.worker",
];

// -------------------- FETCH --------------------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 🚨 ABSOLUTE RULE: Let .NET runtime + workers go straight to network
  if (
    PASSTHROUGH.some(
      (p) => url.pathname.includes(p)
    )
  ) {
    return; // browser handles it directly
  }

  event.respondWith(
    (async () => {
      let response =
        (await caches.match(event.request)) ||
        (await fetch(event.request));

      // Only add isolation headers to DOCUMENTS
      if (event.request.destination === "document") {
        const headers = new Headers(response.headers);
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Cross-Origin-Embedder-Policy", "require-corp");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }

      return response;
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

  const resources = [
    "./",
    "./MILESTONE",
    "./app.ico",
    "./backdrop.png",
    "./AndyBold.ttf",
    "./assets/index.js",
    "./assets/index.css",
  ];

  await cache.addAll(resources);
  console.log("[SW] Static cache installed");
}

// -------------------- ACTIVATE --------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      );
      await self.clients.claim();
      console.log("[SW] Activated");
    })()
  );
});
