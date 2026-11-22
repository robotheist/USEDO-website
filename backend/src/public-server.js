// Entry point of the PUBLIC site: `npm run start:public`.
// Reads the «Документи» tree from Drive (read-only) and serves the public frontend.
// Does not load the internal tracker (statuses, owners, editing) at all.

import { config } from "./config.js";
import { createPublicApp, PublicTree } from "./public/app.js";
import { createDriveSource, createFixtureSource } from "./public/sources.js";

const source = config.dataSource === "google" ? await createDriveSource() : createFixtureSource();
const tree = new PublicTree(source, {
  rootId: config.documentsFolderId,
  refreshMs: Number(process.env.PUBLIC_REFRESH_MS || 60_000),
});

try {
  const t = await tree.refresh();
  const n = t.sections.reduce((a, s) => a + s.items.length, 0);
  console.log(`[public] loaded ${t.sections.length} sections, ${n} top-level items from "${source.name}"`);
} catch (err) {
  console.error(`[public] first read failed: ${err.message} — will retry on the next request`);
}
if (source.name === "fixtures") console.log("[public] using fixtures/public-drive.json. For live Drive see backend/README.md → \"Live data\".");

createPublicApp(tree, { corsOrigins: config.corsOrigins, serveFrontend: config.serveFrontend })
  .listen(config.port, () => console.log(`[public] http://127.0.0.1:${config.port}`));
