// Holds the current snapshot, refreshes it from the data source on a timer
// (so edits made directly in the spreadsheet show up on the site), and writes
// status and owner changes made on the site back into «Звіт по документах».

import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";
import { buildModel } from "./model.js";
import { buildMatcher, columnLetter, normalizeName, readTable, resolveStatus, statusFromLabel } from "./parse.js";

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
    const [sections, report, periods, deadlines, people] = await Promise.all([
      source.listChildFolders(cfg.documentsFolderId),
      source.getValues(cfg.report.spreadsheetId, cfg.report.sheet),
      source.getValues(cfg.periods.spreadsheetId, cfg.periods.sheet),
      source.getValues(cfg.deadlines.spreadsheetId, cfg.deadlines.sheet),
      // Optional tab: without it the site just has no names to choose from.
      source.getValues(cfg.people.spreadsheetId, cfg.people.sheet).catch(() => []),
    ]);
    const folderLists = await Promise.all(sections.map((s) => source.listChildFolders(s.id)));
    const folders = Object.fromEntries(sections.map((s, i) => [s.id, folderLists[i]]));
    return { sections, folders, report, periods, deadlines, people };
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
          this._refreshedAt = this.now().getTime();
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

  // Returns the snapshot, re-reading first if it is older than the poll
  // interval. The timer alone isn't enough on hosts that pause idle instances
  // (Cloud Run): after a quiet spell the first request would get stale data.
  // If that re-read fails, the last good snapshot is served.
  async get() {
    if (!this.snapshot) return this.refresh();
    const maxAge = this.cfg.pollIntervalMs;
    if (maxAge && this.now().getTime() - (this._refreshedAt || 0) > maxAge) {
      try { return await this.refresh(); } catch { return this.snapshot; }
    }
    return this.snapshot;
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
    return this._writeCell(documentId, "status", () => {
      const status = resolveStatus(statusInput);
      if (!status) throw new HttpError(400, `Unknown status "${statusInput}"`);
      return status.label;
    }, {
      current: (row) => (row ? statusFromLabel(row.get("status"))?.key ?? (row.get("status") ? "unknown" : "not_set") : "not_in_report"),
      conflict: (current) => Boolean(expected) && expected !== current,
      what: "status",
    });
  }

  // Writes the responsible person into the «Відповідальний» column. Only
  // names from the «Відповідальні» tab are accepted ("" clears it), so the
  // column stays clean; the spelling from that tab is what gets written.
  // `expected` (optional, the owner the client last saw; "" = none) → 409 on mismatch.
  setOwner(documentId, ownerInput, { expected } = {}) {
    return this._writeCell(documentId, "owner", (snap) => {
      if (typeof ownerInput !== "string") throw new HttpError(400, "owner must be a string");
      const owner = ownerInput.replace(/\s+/g, " ").trim();
      if (!owner) return "";
      const match = snap.people.find((p) => normalizeName(p) === normalizeName(owner));
      if (!match) throw new HttpError(400, `"${owner}" is not in the «${this.cfg.people.sheet}» tab; add the person there first`);
      return match;
    }, {
      current: (row) => (row ? row.get("owner").replace(/\s+/g, " ").trim() : ""),
      conflict: (current) => expected !== undefined && expected !== null && normalizeName(expected) !== normalizeName(current),
      what: "responsible person",
    });
  }

  // Shared write path: validate → find the row in a FRESH read of the sheet
  // (rows may have been inserted, deleted or re-sorted since the last refresh)
  // → conflict check → write one cell, or append a row for a document the
  // table doesn't have yet → re-read so the response reflects the table.
  _writeCell(documentId, key, makeValue, { current, conflict, what }) {
    const run = async () => {
      const snap = await this.get();
      const doc = this.findDocument(snap, documentId);
      if (!doc) throw new HttpError(404, "Document not found");
      const value = makeValue(snap);

      const { report } = this.cfg;
      const values = await this.source.getValues(report.spreadsheetId, report.sheet);
      const table = readTable(values, report.columns);
      if (table.idx[key] < 0) throw new HttpError(500, `Column "${report.columns[key]}" not found in the report sheet`);
      const hit = buildMatcher(table.rows, (r) => r.get("name"))(doc.name);

      const now = current(hit && hit.row);
      if (conflict(now)) {
        throw new HttpError(409, `The ${what} was changed in the table in the meantime`, { current: now });
      }

      if (hit) {
        const a1 = `${columnLetter(table.idx[key])}${hit.row.rowNumber}`;
        await this.source.updateValue(report.spreadsheetId, report.sheet, a1, value);
      } else {
        const row = new Array(Math.max(table.width, table.idx.name + 1, table.idx[key] + 1)).fill("");
        row[table.idx.name] = doc.name;
        row[table.idx[key]] = value;
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
