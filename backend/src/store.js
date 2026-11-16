// Holds the current snapshot, refreshes it from the data source on a timer
// (so edits made directly in the spreadsheet show up on the site), and writes
// status changes made on the site back into «Звіт по документах».

import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { buildModel } from "./model.js";
import { buildMatcher, columnLetter, readTable, resolveStatus, statusFromLabel } from "./parse.js";

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}

export class Store extends EventEmitter {
  constructor(source, cfg, { now = () => new Date() } = {}) {
    super();
    this.source = source;
    this.cfg = cfg;
    this.now = now;
    this.snapshot = null;
    this.version = 0;
    this.hash = "";
    this.lastError = null;
    this._inflight = null;
    this._writeChain = Promise.resolve();
    this._timer = null;
  }

  async _fetchRaw() {
    const { cfg, source } = this;
    const [sections, report, periods, deadlines] = await Promise.all([
      source.listChildFolders(cfg.documentsFolderId),
      source.getValues(cfg.report.spreadsheetId, cfg.report.sheet),
      source.getValues(cfg.periods.spreadsheetId, cfg.periods.sheet),
      source.getValues(cfg.deadlines.spreadsheetId, cfg.deadlines.sheet),
    ]);
    const folderLists = await Promise.all(sections.map((s) => source.listChildFolders(s.id)));
    const folders = Object.fromEntries(sections.map((s, i) => [s.id, folderLists[i]]));
    return { sections, folders, report, periods, deadlines };
  }

  // Re-reads everything. Concurrent callers share one in-flight refresh.
  refresh() {
    if (!this._inflight) {
      this._inflight = (async () => {
        try {
          const raw = await this._fetchRaw();
          const model = buildModel(raw, this.cfg, this.now());
          const hash = createHash("sha1").update(JSON.stringify(model)).digest("hex");
          this.lastError = null;
          if (hash !== this.hash) {
            this.hash = hash;
            this.version++;
            this.snapshot = { version: this.version, updatedAt: this.now().toISOString(), source: this.source.name, ...model };
            this.emit("change", { version: this.version });
          }
          return this.snapshot;
        } catch (err) {
          this.lastError = { message: err.message, at: this.now().toISOString() };
          throw err;
        } finally {
          this._inflight = null;
        }
      })();
    }
    return this._inflight;
  }

  async get() {
    return this.snapshot || this.refresh();
  }

  start() {
    if (this._timer || !this.cfg.pollIntervalMs) return;
    this._timer = setInterval(() => {
      this.refresh().catch((err) => console.error(`[store] refresh failed: ${err.message}`));
    }, this.cfg.pollIntervalMs);
    this._timer.unref?.();
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
  }

  findDocument(snapshot, id) {
    for (const s of snapshot.sections) for (const d of s.documents) if (d.id === id) return d;
    return null;
  }

  findSection(snapshot, idOrSlug) {
    return snapshot.sections.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null;
  }

  // Writes a new status for a document into «Звіт по документах».
  // `expected` (optional status key) guards against overwriting a change someone
  // else made in the table since the client loaded the page → 409.
  setStatus(documentId, statusInput, { expected } = {}) {
    const run = async () => {
      const status = resolveStatus(statusInput);
      if (!status) throw new HttpError(400, `Unknown status "${statusInput}"`);

      const snap = await this.get();
      const doc = this.findDocument(snap, documentId);
      if (!doc) throw new HttpError(404, "Document not found");

      // Always locate the row in a FRESH read: rows may have been inserted,
      // deleted or re-sorted in the sheet since the last refresh.
      const { report } = this.cfg;
      const values = await this.source.getValues(report.spreadsheetId, report.sheet);
      const table = readTable(values, report.columns);
      if (table.idx.status < 0) throw new HttpError(500, `Column "${report.columns.status}" not found in the report sheet`);
      const hit = buildMatcher(table.rows, (r) => r.get("name"))(doc.name);

      const current = hit ? statusFromLabel(hit.row.get("status"))?.key ?? (hit.row.get("status") ? "unknown" : "not_set") : "not_in_report";
      if (expected && expected !== current) {
        throw new HttpError(409, "The status was changed in the table in the meantime", { current });
      }

      if (hit) {
        const a1 = `${columnLetter(table.idx.status)}${hit.row.rowNumber}`;
        await this.source.updateValue(report.spreadsheetId, report.sheet, a1, status.label);
      } else {
        // The document exists in Drive but not in the table yet: add a row for it.
        const row = new Array(Math.max(table.width, table.idx.name + 1, table.idx.status + 1)).fill("");
        row[table.idx.name] = doc.name;
        row[table.idx.status] = status.label;
        await this.source.appendRow(report.spreadsheetId, report.sheet, row);
      }

      // A poll that started before the write would return pre-write data, so
      // wait it out and start a new read.
      if (this._inflight) await this._inflight.catch(() => {});
      const fresh = await this.refresh();
      return this.findDocument(fresh, documentId);
    };
    // Serialize writes so two quick edits can't race on row lookup.
    const p = this._writeChain.then(run, run);
    this._writeChain = p.catch(() => {});
    return p;
  }
}
