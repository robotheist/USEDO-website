// Reads the «Документи» folder tree from Drive for the public site.
//
//   level 1  sections   (folders in «Документи»)
//   level 2  items      (a document folder, a group folder, or a file)
//   level 3  documents  (inside a group) or files (inside a document)
//   level 4  files      (inside a document of a group)
//
// Each level is one batched query (`'a' in parents or 'b' in parents …`), so a
// full refresh costs a handful of API calls no matter how many folders exist.

export const FOLDER = "application/vnd.google-apps.folder";
export const MAX_DEPTH = 4;

// "Бюджет закладу освіти [Регулярний]" → "Бюджет закладу освіти".
// The update type is internal bookkeeping and is not shown publicly.
const TYPE_SUFFIX = /\s*\[(Регулярний|Стихійний|Змішаний|Не застосовується)\]\s*$/i;
export const publicName = (name) => String(name || "").replace(TYPE_SUFFIX, "").replace(/\s+/g, " ").trim();

const byName = (a, b) =>
  (a.kind === b.kind ? 0 : a.kind === "folder" ? -1 : 1) || a.name.localeCompare(b.name, "uk", { numeric: true });

const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;
const fileUrl = (id) => `https://drive.google.com/file/d/${id}/view`;

function toNode(f) {
  const isFolder = f.mimeType === FOLDER;
  return {
    id: f.id,
    name: publicName(f.name),
    kind: isFolder ? "folder" : "file",
    ...(isFolder ? {} : { mimeType: f.mimeType }),
    url: isFolder ? folderUrl(f.id) : f.webViewLink || fileUrl(f.id),
    ...(isFolder ? { children: [] } : {}),
  };
}

// source.listChildren(parentIds) → [{ id, name, mimeType, parentId, webViewLink? }]
export async function readTree(source, rootId, { maxDepth = MAX_DEPTH } = {}) {
  const root = { id: rootId, children: [] };
  let level = [root];
  for (let depth = 1; depth <= maxDepth && level.length; depth++) {
    const byId = new Map(level.map((n) => [n.id, n]));
    const items = await source.listChildren([...byId.keys()]);
    const next = [];
    for (const f of items) {
      const parent = byId.get(f.parentId);
      if (!parent) continue;
      // Only folders at level 1 are sections; loose files there are ignored.
      if (depth === 1 && f.mimeType !== FOLDER) continue;
      const node = toNode(f);
      parent.children.push(node);
      if (node.kind === "folder") next.push(node);
    }
    for (const n of level) n.children.sort(byName);
    level = next;
  }
  return root.children.map(({ id, name, url, children }) => ({ id, name, url, items: children }));
}

export function countFiles(sections) {
  let folders = 0, files = 0;
  const walk = (nodes) => { for (const n of nodes) { n.kind === "file" ? files++ : folders++; if (n.children) walk(n.children); } };
  for (const s of sections) walk(s.items);
  return { sections: sections.length, folders, files };
}
