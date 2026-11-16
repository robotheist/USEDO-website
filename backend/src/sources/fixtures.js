// In-memory data source backed by fixtures/*.json. Same interface as the Google
// source. Writes change memory only (restart = reset), which makes it safe for
// frontend development and for tests.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const load = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../fixtures/${name}`, import.meta.url)), "utf8"));

function cellRef(a1) {
  const m = /^([A-Z]+)(\d+)$/.exec(a1);
  if (!m) throw new Error(`Unsupported A1 reference: ${a1}`);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { row: Number(m[2]) - 1, col: col - 1 };
}

export function createFixtureSource({ drive = load("drive.json"), sheets = load("sheets.json") } = {}) {
  drive = structuredClone(drive);
  sheets = structuredClone(sheets);

  const sheet = (id, name) => {
    const s = sheets[id]?.[name];
    if (!s) throw new Error(`Fixture has no sheet "${name}" in ${id}`);
    return s;
  };

  return {
    name: "fixtures",

    async listChildFolders(parentId) {
      return structuredClone(drive.folders[parentId] || []);
    },

    async getValues(spreadsheetId, name) {
      return structuredClone(sheet(spreadsheetId, name));
    },

    async updateValue(spreadsheetId, name, a1, value) {
      const values = sheet(spreadsheetId, name);
      const { row, col } = cellRef(a1);
      while (values.length <= row) values.push([]);
      while (values[row].length <= col) values[row].push("");
      values[row][col] = value;
    },

    async appendRow(spreadsheetId, name, row) {
      sheet(spreadsheetId, name).push([...row]);
    },

    // Test/dev helpers: simulate someone editing Drive or the table directly.
    _drive: drive,
    _sheets: sheets,
  };
}
