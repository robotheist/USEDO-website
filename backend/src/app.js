import express from "express";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import { STATUSES, UPDATE_TYPES } from "./parse.js";
import { HttpError } from "./store.js";

const FRONTEND_ROOT = fileURLToPath(new URL("../../", import.meta.url));
// Only these files are served from the repo root — never backend/, keys, .git, etc.
const FRONTEND_FILES = ["index.html", "app.js", "data.js", "styles.css", "kse-logo.svg"];

const summary = ({ documents, ...section }) => section;

export function createApp(store, cfg) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  // CORS for the frontend dev server (e.g. python -m http.server 5180).
  app.use("/api", (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (cfg.corsOrigins.includes("*") || cfg.corsOrigins.includes(origin))) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Methods", "GET, PATCH, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const requireAdmin = (req, res, next) => {
    if (!cfg.adminToken) return next();
    const got = Buffer.from(String(req.headers.authorization || ""));
    const want = Buffer.from(`Bearer ${cfg.adminToken}`);
    if (got.length === want.length && timingSafeEqual(got, want)) return next();
    next(new HttpError(401, "Missing or invalid admin token"));
  };

  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

  app.get("/api/health", (req, res) => {
    res.json({
      ok: !store.lastError,
      source: store.source.name,
      version: store.version,
      updatedAt: store.snapshot?.updatedAt ?? null,
      lastError: store.lastError,
      pollIntervalMs: cfg.pollIntervalMs,
      writesRequireToken: Boolean(cfg.adminToken),
    });
  });

  // Vocabularies, so the frontend never hard-codes sheet labels.
  app.get("/api/meta", (req, res) => {
    res.json({ statuses: STATUSES, updateTypes: Object.values(UPDATE_TYPES), blockStatuses: ["up_to_date", "needs_renewal"] });
  });

  // Everything in one call: blocks with their documents.
  app.get("/api/snapshot", wrap(async (req, res) => {
    res.json(await store.get());
  }));

  app.get("/api/sections", wrap(async (req, res) => {
    const snap = await store.get();
    res.json({ version: snap.version, updatedAt: snap.updatedAt, sections: snap.sections.map(summary) });
  }));

  app.get("/api/sections/:id", wrap(async (req, res) => {
    const snap = await store.get();
    const section = store.findSection(snap, req.params.id);
    if (!section) throw new HttpError(404, "Section not found");
    res.json({ version: snap.version, section });
  }));

  app.get("/api/documents/:id", wrap(async (req, res) => {
    const snap = await store.get();
    const doc = store.findDocument(snap, req.params.id);
    if (!doc) throw new HttpError(404, "Document not found");
    res.json({ version: snap.version, document: doc });
  }));

  // Body: { "status": "up_to_date" | "Оновлений" | …, "expected"?: "<current status key>" }
  app.patch("/api/documents/:id/status", requireAdmin, wrap(async (req, res) => {
    const { status, expected } = req.body || {};
    const doc = await store.setStatus(req.params.id, status, { expected });
    const snap = await store.get();
    const section = snap.sections.find((s) => s.id === doc.sectionId);
    res.json({ version: snap.version, document: doc, section: section ? summary(section) : null });
  }));

  // Body: { "owner": "Берзеніна" | "" (clear), "expected"?: "<owner the client last saw>" }
  app.patch("/api/documents/:id/owner", requireAdmin, wrap(async (req, res) => {
    const { owner, expected } = req.body || {};
    const doc = await store.setOwner(req.params.id, owner, { expected });
    const snap = await store.get();
    res.json({ version: snap.version, document: doc });
  }));

  // People who can be set as responsible (the «Відповідальні» tab).
  app.get("/api/people", wrap(async (req, res) => {
    const snap = await store.get();
    res.json({ version: snap.version, people: snap.people });
  }));

  // Force an immediate re-read of Drive + Sheets (instead of waiting for the poll).
  app.post("/api/refresh", requireAdmin, wrap(async (req, res) => {
    const snap = await store.refresh();
    res.json({ version: snap.version, updatedAt: snap.updatedAt });
  }));

  // Server-Sent Events: emits `change` with the new version whenever the data
  // changes (edit on the site, edit in the table, new folder in Drive).
  app.get("/api/events", (req, res) => {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    res.write(`retry: 5000\nevent: hello\ndata: ${JSON.stringify({ version: store.version })}\n\n`);
    const onChange = (e) => res.write(`event: change\ndata: ${JSON.stringify(e)}\n\n`);
    const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
    store.on("change", onChange);
    req.on("close", () => { clearInterval(ping); store.off("change", onChange); });
  });

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  if (cfg.serveFrontend) {
    app.get("/", (req, res) => res.sendFile("index.html", { root: FRONTEND_ROOT }));
    for (const f of FRONTEND_FILES) app.get(`/${f}`, (req, res) => res.sendFile(f, { root: FRONTEND_ROOT }));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || (err.type === "entity.parse.failed" ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 && !(err instanceof HttpError) ? "Internal error" : err.message, ...(err.extra || {}) });
  });

  return app;
}
