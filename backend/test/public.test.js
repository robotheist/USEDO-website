// Public site: Drive tree → /api/public/tree, read-only.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createPublicApp, PublicTree } from "../src/public/app.js";
import { createFixtureSource } from "../src/public/sources.js";
import { publicName, readTree } from "../src/public/tree.js";

const ROOT = "1awFZGigqGekfTfcXr-9xR_Akbq0k9wCj";
const UPBRINGING = "1ki5xIVDrzS8FUBgYRPzPg1KE9TUVOf0x";
const BULLYING = "1SMFQzhoPa6_BU1tPrWyHnT1b282Ktsek"; // group «Протидія булінгу»
const BUDGET = "1zZebMjToE7DejjQwUEMAxJd4012Yjmbp"; // document folder «Бюджет закладу освіти»

let server, base, source, tree, clock;

beforeEach(async () => {
  clock = 1_000_000;
  source = createFixtureSource();
  tree = new PublicTree(source, { rootId: ROOT, refreshMs: 60_000, now: () => clock });
  server = createPublicApp(tree, { corsOrigins: ["http://localhost:5180"] }).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(() => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }));

const getTree = async () => (await fetch(`${base}/api/public/tree`)).json();
const section = (t, id) => t.sections.find((s) => s.id === id);

test("type suffixes are stripped from public names", () => {
  assert.equal(publicName("Бюджет закладу освіти [Регулярний]"), "Бюджет закладу освіти");
  assert.equal(publicName("Інформація (англійською)[Змішаний]"), "Інформація (англійською)");
  assert.equal(publicName("Гайд для вступника"), "Гайд для вступника");
});

test("returns the nine sections with documents, groups and Drive links", async () => {
  const t = await getTree();
  assert.equal(t.sections.length, 9);
  assert.equal(t.source, "fixtures");
  const up = section(t, UPBRINGING);
  assert.equal(up.name, "Виховні процеси");
  assert.equal(up.url, `https://drive.google.com/drive/folders/${UPBRINGING}`);
  const group = up.items.find((n) => n.id === BULLYING);
  assert.equal(group.name, "Протидія булінгу");
  assert.equal(group.children.length, 4);
  // folders first, then by name (Ukrainian collation)
  const names = up.items.map((n) => n.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "uk", { numeric: true })));
});

test("a folder or file added in Drive appears after the refresh interval", async () => {
  const before = await getTree();
  assert.equal(section(before, UPBRINGING).items.length, 7);

  source._tree[UPBRINGING].push({ id: "newDoc", name: "Новий документ [Стихійний]" });
  source._tree[BUDGET] = [{ id: "pdf1", name: "Бюджет 2026.pdf", mimeType: "application/pdf" }];

  // still cached
  assert.equal(section(await getTree(), UPBRINGING).items.length, 7);

  clock += 61_000;
  const after = await getTree();
  const added = section(after, UPBRINGING).items.find((n) => n.id === "newDoc");
  assert.equal(added.name, "Новий документ");
  const budget = after.sections.flatMap((s) => s.items).find((n) => n.id === BUDGET);
  assert.deepEqual(budget.children, [{ id: "pdf1", name: "Бюджет 2026.pdf", kind: "file", mimeType: "application/pdf", url: "https://drive.google.com/file/d/pdf1/view" }]);
});

test("a new section folder in Drive becomes a new section", async () => {
  source._tree[ROOT].push({ id: "newSection", name: "Міжнародна співпраця" });
  source._tree.newSection = [{ id: "d1", name: "Угоди з партнерами" }];
  const sections = await readTree(source, ROOT);
  const s = sections.find((x) => x.id === "newSection");
  assert.equal(s.items[0].name, "Угоди з партнерами");
});

test("if Drive fails, the last good tree is still served", async () => {
  await getTree();
  source.listChildren = async () => { throw new Error("quota"); };
  clock += 61_000;
  const res = await fetch(`${base}/api/public/tree`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).sections.length, 9);
  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.ok, false);
  assert.equal(health.lastError.message, "quota");
});

test("the API is read-only and exposes no internal tracker routes", async () => {
  assert.equal((await fetch(`${base}/api/public/tree`, { method: "POST" })).status, 405);
  assert.equal((await fetch(`${base}/api/snapshot`)).status, 404);
  assert.equal((await fetch(`${base}/api/documents/${BUDGET}/status`, { method: "PATCH" })).status, 405);
});

test("CORS allows only configured origins", async () => {
  const ok = await fetch(`${base}/api/public/tree`, { headers: { Origin: "http://localhost:5180" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:5180");
  const other = await fetch(`${base}/api/public/tree`, { headers: { Origin: "https://evil.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});
