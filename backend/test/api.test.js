// End-to-end tests over HTTP against the fixture data source.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { config as baseConfig } from "../src/config.js";
import { createApp } from "../src/app.js";
import { Store } from "../src/store.js";
import { createFixtureSource } from "../src/sources/fixtures.js";

const REPORT = baseConfig.report;
const BUDGET = "1zZebMjToE7DejjQwUEMAxJd4012Yjmbp"; // «Бюджет закладу освіти [Регулярний]», Фінансові питання, report row 41
const HR = "1SfCjiNsXV_vNvt5swK_iXDGJsgiPWqUh";

let server, base, source, store, cfg;

async function start(overrides = {}) {
  cfg = { ...baseConfig, pollIntervalMs: 0, adminToken: "", corsOrigins: ["http://localhost:5180"], ...overrides };
  source = createFixtureSource();
  store = new Store(source, cfg, { now: () => new Date("2026-11-16T10:00:00Z") });
  await store.refresh();
  server = createApp(store, cfg).listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
}

const api = (path, opts = {}) => fetch(base + path, {
  ...opts,
  headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  body: opts.body && JSON.stringify(opts.body),
});
const reportCell = (row, col = 3) => source._sheets[REPORT.spreadsheetId][REPORT.sheet][row - 1][col];

beforeEach(() => start());
afterEach(() => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }));

test("1–3. nine blocks from Drive, each with a status; documents carry relevance + periodicity", async () => {
  const snap = await (await api("/api/snapshot")).json();
  assert.equal(snap.sections.length, 9);
  assert.deepEqual(snap.sections.map((s) => s.slug), ["admission", "finance", "education", "operations", "policies", "hr", "upbringing", "science", "selfgov"]);
  for (const s of snap.sections) assert.ok(["up_to_date", "needs_renewal"].includes(s.status));
  assert.equal(snap.sections.flatMap((s) => s.documents).length, 57);
  assert.deepEqual(snap.warnings, []);

  const finance = snap.sections.find((s) => s.slug === "finance");
  assert.equal(finance.status, "needs_renewal");
  const budget = finance.documents.find((d) => d.id === BUDGET);
  assert.equal(budget.name, "Бюджет закладу освіти");
  assert.deepEqual(budget.relevance, { upToDate: false, status: "outdated", statusLabel: "Застарілий", owner: "Берзеніна", ownerNote: null, note: "Берзеніна", action: null, reportRow: 41 });
  assert.equal(budget.periodicity.periodic, true);
  assert.equal(budget.periodicity.label, "periodic: Щороку");
  assert.deepEqual(budget.nextUpdate, { label: "Січень 2027", due: "2027-01-31", daysLeft: 76, overdue: false, cycle: "Щороку" });

  const homepage = snap.sections.flatMap((s) => s.documents).find((d) => d.name.startsWith("Головна сторінка"));
  assert.equal(homepage.relevance.upToDate, true);
  assert.equal(homepage.periodicity.label, "non-periodic");
  assert.equal(homepage.nextUpdate, null);
});

test("4. every document links to its own Drive folder", async () => {
  const snap = await (await api("/api/snapshot")).json();
  for (const d of snap.sections.flatMap((s) => s.documents)) {
    assert.equal(d.url, `https://drive.google.com/drive/folders/${d.id}`);
    assert.ok(d.folderName.startsWith(d.name));
  }
});

test("5. an edit made directly in the table shows up after the next poll, with a change event", async () => {
  const events = [];
  store.on("change", (e) => events.push(e));
  const v0 = store.version;

  source._sheets[REPORT.spreadsheetId][REPORT.sheet][40][3] = "Оновлений"; // row 41 = Бюджет
  await store.refresh();

  const { document } = await (await api(`/api/documents/${BUDGET}`)).json();
  assert.equal(document.relevance.status, "up_to_date");
  assert.equal(store.version, v0 + 1);
  assert.deepEqual(events, [{ version: v0 + 1 }]);

  await store.refresh(); // nothing changed → no new version
  assert.equal(store.version, v0 + 1);
});

test("5a. a request after an idle spell re-reads stale data before answering (paused hosts)", async () => {
  let clock = Date.parse("2026-11-16T10:00:00Z");
  const src = createFixtureSource();
  const s = new Store(src, { ...baseConfig, pollIntervalMs: 30_000 }, { now: () => new Date(clock) });
  await s.refresh();
  src._sheets[REPORT.spreadsheetId][REPORT.sheet][40][3] = "Оновлений"; // edited in the table; no poll ran
  const status = (snap) => s.findDocument(snap, BUDGET).relevance.status;

  clock += 10_000;
  assert.equal(status(await s.get()), "outdated"); // still fresh enough → cached
  clock += 25_000;
  assert.equal(status(await s.get()), "up_to_date"); // older than the poll interval → re-read

  src.getValues = async () => { throw new Error("Google down"); };
  clock += 60_000;
  assert.equal(status(await s.get()), "up_to_date"); // re-read fails → last good snapshot
  assert.equal(s.lastError.message, "Google down");
});

test("5b. a new document folder in Drive appears on the next poll", async () => {
  source._drive.folders[HR].push({ id: "NEW", name: "Новий документ [Стихійний]" });
  await store.refresh();
  const { section } = await (await api("/api/sections/hr")).json();
  const doc = section.documents.find((d) => d.id === "NEW");
  assert.equal(doc.relevance.status, "not_in_report");
  assert.equal(doc.periodicity.label, "non-periodic");
  assert.ok(store.snapshot.warnings.some((w) => w.code === "not_in_report"));
});

test("6. updating a status on the site writes the exact label into column «Статус» of the right row", async () => {
  const res = await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date" } });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.document.relevance.status, "up_to_date");
  assert.equal(body.section.counts.upToDate, 1);
  assert.equal(reportCell(41), "Оновлений");
  assert.equal(reportCell(40), "Застарілий"); // neighbours untouched
  assert.equal(reportCell(42), "Застарілий");

  // Sheet labels are accepted too.
  await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "Зміна сайту - посилання не працює" } });
  assert.equal(reportCell(41), "Зміна сайту - посилання не працює");
});

test("6b. the row is found by name at write time even if rows moved in the sheet", async () => {
  const sheet = source._sheets[REPORT.spreadsheetId][REPORT.sheet];
  sheet.splice(1, 0, ["Новий рядок зверху", "", "", "Відсутній"]); // shifts every row down by one
  await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "missing" } });
  assert.equal(sheet[41][0], "Бюджет закладу освіти");
  assert.equal(sheet[41][3], "Відсутній");
  assert.equal(sheet[1][3], "Відсутній");
});

test("6c. a block flips to up_to_date once all its documents are", async () => {
  const hr = (await (await api("/api/sections/hr")).json()).section;
  assert.equal(hr.status, "needs_renewal");
  let last;
  for (const d of hr.documents) {
    last = await (await api(`/api/documents/${d.id}/status`, { method: "PATCH", body: { status: "up_to_date" } })).json();
  }
  assert.equal(last.section.status, "up_to_date");
  assert.equal(last.section.counts.needsRenewal, 0);
});

test("6d. [Не застосовується] documents don't block a section", async () => {
  const ops = (await (await api("/api/sections/operations")).json()).section;
  const na = ops.documents.filter((d) => d.notApplicable);
  assert.equal(na.length, 1);
  let last;
  for (const d of ops.documents.filter((d) => !d.notApplicable)) {
    last = await (await api(`/api/documents/${d.id}/status`, { method: "PATCH", body: { status: "up_to_date" } })).json();
  }
  assert.equal(last.section.status, "up_to_date");
});

test("6e. a document without a table row gets a new row appended", async () => {
  source._drive.folders[HR].push({ id: "NEW", name: "Новий документ [Стихійний]" });
  await store.refresh();
  const res = await api("/api/documents/NEW/status", { method: "PATCH", body: { status: "under_review" } });
  assert.equal(res.status, 200);
  const sheet = source._sheets[REPORT.spreadsheetId][REPORT.sheet];
  assert.deepEqual(sheet.at(-1).slice(0, 4), ["Новий документ", "", "", "На розгляді"]);
  assert.equal((await res.json()).document.relevance.status, "under_review");
});

test("6f. optimistic concurrency: expected status mismatch → 409, nothing written", async () => {
  source._sheets[REPORT.spreadsheetId][REPORT.sheet][40][3] = "На розгляді"; // someone edited the table
  const res = await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date", expected: "outdated" } });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).current, "under_review");
  assert.equal(reportCell(41), "На розгляді");
});

// ---------- Responsible person («Відповідальний») ----------

const ACCESS = "1x5jqjz14wxwhGxj9ars7Heuat2uoYI8t"; // «Умови доступності…», row 22: note "Висновок + інформація від Яковенко"
const OWNER_COL = 6; // G

test("owner: snapshot has the people list, owner from «Відповідальний», note only when it adds something", async () => {
  const snap = await (await api("/api/snapshot")).json();
  assert.deepEqual(snap.people, ["Берзеніна", "Вячеслав", "Манилюк", "Пряміцин", "Рудик", "Сердюк", "Щербак", "Юдін", "Яковенко"]);
  assert.deepEqual(await (await api("/api/people")).json(), { version: 1, people: snap.people });
  const docs = snap.sections.flatMap((s) => s.documents);
  const access = docs.find((d) => d.id === ACCESS).relevance;
  assert.equal(access.owner, "Яковенко");
  assert.equal(access.ownerNote, "Висновок + інформація від Яковенко");
  const budget = docs.find((d) => d.id === BUDGET).relevance;
  assert.equal(budget.owner, "Берзеніна");
  assert.equal(budget.ownerNote, null); // note "Берзеніна" just repeats the name
  const homepage = docs.find((d) => d.name.startsWith("Головна сторінка")).relevance;
  assert.equal(homepage.owner, null);
  assert.deepEqual(snap.warnings, []);
});

test("owner: PATCH writes the canonical name into column «Відповідальний» of the right row; '' clears it", async () => {
  const res = await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "  юдін " } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).document.relevance.owner, "Юдін");
  assert.equal(reportCell(41, OWNER_COL), "Юдін");
  assert.equal(reportCell(41, 5), "Берзеніна"); // note column untouched
  assert.equal(reportCell(40, OWNER_COL), "Щербак"); // neighbours untouched
  assert.equal(reportCell(42, OWNER_COL), "Берзеніна");

  const cleared = await (await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "" } })).json();
  assert.equal(reportCell(41, OWNER_COL), "");
  assert.equal(cleared.document.relevance.owner, null);
  assert.equal(cleared.document.relevance.ownerNote, "Берзеніна"); // now the note is informative
});

test("owner: only people from the list; conflicts → 409; unknown document → 404", async () => {
  const bad = await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "Хтось Новий" } });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /Відповідальні/);
  assert.equal((await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: 5 } })).status, 400);
  assert.equal((await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: {} })).status, 400);
  assert.equal((await api("/api/documents/nope/owner", { method: "PATCH", body: { owner: "Юдін" } })).status, 404);

  source._sheets[REPORT.spreadsheetId][REPORT.sheet][40][OWNER_COL] = "Рудик"; // someone edited the table
  const res = await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "Юдін", expected: "Берзеніна" } });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).current, "Рудик");
  assert.equal(reportCell(41, OWNER_COL), "Рудик");
  // expected is compared case- and space-insensitively
  const ok = await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "Юдін", expected: "рудик" } });
  assert.equal(ok.status, 200);
});

test("owner: a document without a table row gets a row with the owner", async () => {
  source._drive.folders[HR].push({ id: "NEW", name: "Новий документ [Стихійний]" });
  await store.refresh();
  assert.equal((await api("/api/documents/NEW/owner", { method: "PATCH", body: { owner: "Манилюк" } })).status, 200);
  const last = source._sheets[REPORT.spreadsheetId][REPORT.sheet].at(-1);
  assert.equal(last[0], "Новий документ");
  assert.equal(last[OWNER_COL], "Манилюк");
});

test("owner: needs the admin token like status", async () => {
  await new Promise((r) => server.close(r));
  await start({ adminToken: "s3cret" });
  assert.equal((await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "Юдін" } })).status, 401);
  assert.equal((await api(`/api/documents/${BUDGET}/owner`, { method: "PATCH", body: { owner: "Юдін" }, headers: { Authorization: "Bearer s3cret" } })).status, 200);
});

test("owner: older sheet without «Відповідальний» → note used as owner (read-only), no people tab is fine", async () => {
  const sheets = JSON.parse(JSON.stringify(createFixtureSource()._sheets));
  sheets[REPORT.spreadsheetId][REPORT.sheet].forEach((r) => r.splice(OWNER_COL, 1));
  delete sheets[REPORT.spreadsheetId]["Відповідальні"];
  const s = new Store(createFixtureSource({ sheets }), { ...baseConfig, pollIntervalMs: 0 });
  const snap = await s.refresh();
  assert.deepEqual(snap.people, []);
  const access = s.findDocument(snap, ACCESS).relevance;
  assert.equal(access.owner, "Висновок + інформація від Яковенко");
  assert.equal(access.ownerNote, null);
  assert.deepEqual(snap.warnings.map((w) => w.code), ["owner_column_missing"]);
  await assert.rejects(s.setOwner(BUDGET, ""), (e) => e.status === 500 && /Відповідальний/.test(e.message));
});

// ---------- Note («У кого знайти оновлений») ----------

const NOTE_COL = 5; // F

test("note: PATCH writes the text into «У кого знайти оновлений» of the right row, collapsed; '' clears it", async () => {
  const res = await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "  Узяти  у фінвідділу\nпісля 15 січня " } });
  assert.equal(res.status, 200);
  const { document } = await res.json();
  assert.equal(reportCell(41, NOTE_COL), "Узяти у фінвідділу після 15 січня");
  assert.equal(document.relevance.ownerNote, "Узяти у фінвідділу після 15 січня");
  assert.equal(document.relevance.note, "Узяти у фінвідділу після 15 січня");
  assert.equal(reportCell(41, OWNER_COL), "Берзеніна"); // owner untouched
  assert.equal(reportCell(40, NOTE_COL), "Загальний слайд від Дениса Щербака"); // neighbours untouched
  assert.equal(reportCell(42, NOTE_COL), "Берзеніна");

  const cleared = await (await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "" } })).json();
  assert.equal(reportCell(41, NOTE_COL), "");
  assert.equal(cleared.document.relevance.note, null);
});

test("note: validation and conflicts", async () => {
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: 5 } })).status, 400);
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: {} })).status, 400);
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "x".repeat(501) } })).status, 400);
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "x".repeat(500) } })).status, 200);
  assert.equal((await api("/api/documents/nope/note", { method: "PATCH", body: { note: "x" } })).status, 404);

  // The note equal to the owner's name is hidden on the page, but `note` carries it, so the client can send it as expected.
  source._sheets[REPORT.spreadsheetId][REPORT.sheet][40][NOTE_COL] = "Берзеніна";
  await store.refresh();
  const doc = (await (await api(`/api/documents/${BUDGET}`)).json()).document;
  assert.equal(doc.relevance.ownerNote, null);
  assert.equal(doc.relevance.note, "Берзеніна");
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "Новий текст", expected: doc.relevance.note } })).status, 200);

  source._sheets[REPORT.spreadsheetId][REPORT.sheet][40][NOTE_COL] = "Змінили в таблиці";
  const res = await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "Мій текст", expected: "Новий текст" } });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).current, "Змінили в таблиці");
  assert.equal(reportCell(41, NOTE_COL), "Змінили в таблиці");
});

test("note: needs the admin token", async () => {
  await new Promise((r) => server.close(r));
  await start({ adminToken: "s3cret" });
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "x" } })).status, 401);
  assert.equal((await api(`/api/documents/${BUDGET}/note`, { method: "PATCH", body: { note: "x" }, headers: { Authorization: "Bearer s3cret" } })).status, 200);
});

test("validation: unknown status → 400, unknown document → 404, bad JSON → 400", async () => {
  assert.equal((await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "great" } })).status, 400);
  assert.equal((await api("/api/documents/nope/status", { method: "PATCH", body: { status: "up_to_date" } })).status, 404);
  const bad = await fetch(`${base}/api/documents/${BUDGET}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(bad.status, 400);
  assert.equal(reportCell(41), "Застарілий");
});

test("auth: with ADMIN_TOKEN set, writes need the bearer token", async () => {
  await new Promise((r) => server.close(r));
  await start({ adminToken: "s3cret" });
  assert.equal((await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date" } })).status, 401);
  assert.equal((await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date" }, headers: { Authorization: "Bearer wrong!" } })).status, 401);
  assert.equal((await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date" }, headers: { Authorization: "Bearer s3cret" } })).status, 200);
  assert.equal((await api("/api/snapshot")).status, 200); // reads stay open
});

test("SSE: /api/events pushes a change event after a write", async () => {
  const ctrl = new AbortController();
  const res = await fetch(`${base}/api/events`, { signal: ctrl.signal });
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const waitFor = async (needle) => {
    while (!buf.includes(needle)) buf += dec.decode((await reader.read()).value);
  };
  await waitFor("event: hello");
  await api(`/api/documents/${BUDGET}/status`, { method: "PATCH", body: { status: "up_to_date" } });
  await waitFor("event: change");
  assert.match(buf, /event: change\ndata: \{"version":2\}/);
  ctrl.abort();
});

test("CORS only for configured origins", async () => {
  const ok = await api("/api/sections", { headers: { Origin: "http://localhost:5180" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:5180");
  const no = await api("/api/sections", { headers: { Origin: "https://evil.example" } });
  assert.equal(no.headers.get("access-control-allow-origin"), null);
});

test("static: serves the frontend but never backend files", async () => {
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.equal((await fetch(`${base}/app.js`)).status, 200);
  assert.equal((await fetch(`${base}/backend/package.json`)).status, 404);
  assert.equal((await fetch(`${base}/backend/src/config.js`)).status, 404);
  assert.equal((await fetch(`${base}/.git/config`)).status, 404);
});
