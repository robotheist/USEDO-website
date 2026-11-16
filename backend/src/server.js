import { config } from "./config.js";
import { createApp } from "./app.js";
import { Store } from "./store.js";
import { createFixtureSource } from "./sources/fixtures.js";

const source = config.dataSource === "google"
  ? (await import("./sources/google.js")).createGoogleSource()
  : createFixtureSource();

const store = new Store(source, config);

try {
  const snap = await store.refresh();
  const docs = snap.sections.reduce((n, s) => n + s.documents.length, 0);
  console.log(`[store] loaded ${snap.sections.length} blocks, ${docs} documents from "${source.name}" (${snap.warnings.length} warnings)`);
} catch (err) {
  // Keep serving: /api/health shows the error and the poll keeps retrying.
  console.error(`[store] initial load failed: ${err.message}`);
}
store.start();

if (!config.adminToken) console.warn("[auth] ADMIN_TOKEN is not set — anyone who can reach the API can change statuses.");
if (source.name === "fixtures") console.warn("[data] using local fixtures; for live data see backend/README.md → \"Live data\".");

createApp(store, config).listen(config.port, () => {
  console.log(`[http] http://127.0.0.1:${config.port}`);
});
