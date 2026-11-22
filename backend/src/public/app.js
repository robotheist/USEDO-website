// Public, read-only API + the public frontend. Exposes only the Drive folder
// tree (names and links) — none of the internal statuses, owners or editing.

import express from "express";
import { fileURLToPath } from "node:url";
import { countFiles, readTree } from "./tree.js";

const FRONTEND_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const FRONTEND_FILES = ["index.html", "app.js", "data.js", "styles.css", "kse-logo.svg"];

// Caches the tree and re-reads Drive when it is older than refreshMs. Readers
// share one in-flight refresh; if Drive fails, the last good tree is served.
export class PublicTree {
  constructor(source, { rootId, refreshMs = 60_000, now = () => Date.now() }) {
    Object.assign(this, { source, rootId, refreshMs, now });
    this.tree = null;
    this.readAt = 0;
    this.lastError = null;
    this._inflight = null;
  }

  refresh() {
    this._inflight ??= (async () => {
      try {
        const sections = await readTree(this.source, this.rootId);
        this.tree = { updatedAt: new Date(this.now()).toISOString(), source: this.source.name, sections };
        this.readAt = this.now();
        this.lastError = null;
        return this.tree;
      } catch (err) {
        this.lastError = { message: err.message, at: new Date(this.now()).toISOString() };
        throw err;
      } finally {
        this._inflight = null;
      }
    })();
    return this._inflight;
  }

  async get() {
    if (!this.tree) return this.refresh();
    if (this.now() - this.readAt > this.refreshMs) {
      try { return await this.refresh(); } catch { return this.tree; }
    }
    return this.tree;
  }
}

export function createPublicApp(tree, { corsOrigins = [], serveFrontend = true } = {}) {
  const app = express();
  app.disable("x-powered-by");

  app.use("/api", (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (corsOrigins.includes("*") || corsOrigins.includes(origin))) {
      res.set({ "Access-Control-Allow-Origin": origin, Vary: "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS" });
    }
    if (req.method === "OPTIONS") return res.sendStatus(204);
    if (req.method !== "GET") return res.status(405).json({ error: "Read-only API" });
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({
      ok: !tree.lastError,
      source: tree.source.name,
      updatedAt: tree.tree?.updatedAt ?? null,
      counts: tree.tree ? countFiles(tree.tree.sections) : null,
      lastError: tree.lastError,
      refreshMs: tree.refreshMs,
    });
  });

  app.get("/api/public/tree", async (req, res, next) => {
    try {
      res.set("Cache-Control", "public, max-age=30");
      res.json(await tree.get());
    } catch (err) { next(err); }
  });

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  if (serveFrontend) {
    app.get("/", (req, res) => res.sendFile("index.html", { root: FRONTEND_ROOT }));
    for (const f of FRONTEND_FILES) app.get(`/${f}`, (req, res) => res.sendFile(f, { root: FRONTEND_ROOT }));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(`[public] ${err.message}`);
    res.status(502).json({ error: "Could not read Google Drive" });
  });

  return app;
}
