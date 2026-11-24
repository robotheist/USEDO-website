// Data sources for the public tree: live Drive (read-only) or a JSON fixture.
// Both expose listChildren(parentIds) → [{ id, name, mimeType, parentId, webViewLink? }].

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FOLDER } from "./tree.js";

const IDS_PER_QUERY = 40; // keeps the `q` string well under Drive's length limit

export async function createDriveSource() {
  const { google } = await import("googleapis");
  const scopes = ["https://www.googleapis.com/auth/drive.readonly"];
  const auth = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), scopes })
    : new google.auth.GoogleAuth({ scopes });
  const drive = google.drive({ version: "v3", auth });

  return {
    name: "google",
    async listChildren(parentIds) {
      const out = [];
      for (let i = 0; i < parentIds.length; i += IDS_PER_QUERY) {
        const chunk = parentIds.slice(i, i + IDS_PER_QUERY);
        const wanted = new Set(chunk);
        const q = `(${chunk.map((id) => `'${id.replace(/'/g, "\\'")}' in parents`).join(" or ")}) and trashed = false`;
        let pageToken;
        do {
          const { data } = await drive.files.list({
            q,
            fields: "nextPageToken, files(id, name, mimeType, parents, webViewLink, shortcutDetails)",
            pageSize: 1000,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            corpora: "allDrives",
          });
          for (const f of data.files || []) {
            const parentId = (f.parents || []).find((p) => wanted.has(p));
            if (!parentId) continue;
            // A shortcut to a folder behaves like that folder.
            const target = f.shortcutDetails;
            if (target?.targetMimeType === FOLDER) {
              out.push({ id: target.targetId, name: f.name, mimeType: FOLDER, parentId });
            } else {
              out.push({ id: f.id, name: f.name, mimeType: f.mimeType, parentId, webViewLink: f.webViewLink });
            }
          }
          pageToken = data.nextPageToken;
        } while (pageToken);
      }
      return out;
    },
  };
}

// fixtures/public-drive.json: { "<parentId>": [{ id, name, mimeType? }] } — a
// snapshot of the real tree, so the public site runs without credentials.
export function createFixtureSource(tree = JSON.parse(readFileSync(fileURLToPath(new URL("../../fixtures/public-drive.json", import.meta.url)), "utf8"))) {
  tree = structuredClone(tree);
  return {
    name: "fixtures",
    async listChildren(parentIds) {
      return parentIds.flatMap((parentId) =>
        (tree[parentId] || []).map((f) => ({ mimeType: FOLDER, ...f, parentId })));
    },
    _tree: tree, // tests: simulate someone adding a folder or file in Drive
  };
}
