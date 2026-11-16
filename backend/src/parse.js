// Pure helpers: no I/O. Everything here is unit-tested in test/parse.test.js.

// ---------- Names ----------

// Normalizes a document name so the same document matches across Drive folder
// names and the spreadsheets, which differ in apostrophes, quotes, line breaks
// and stray whitespace.
export function normalizeName(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[’ʼ‘`´]/g, "'")
    .replace(/[«»“”„]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[\s.,;:]+$/g, "")
    .trim();
}

const tokens = (s) => new Set(normalizeName(s).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2));

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

// Builds a matcher over table rows. `match(name)` returns the row for that
// document name: exact (normalized) match first, otherwise the single best fuzzy
// match above the threshold. Ambiguous fuzzy matches return null rather than
// guessing, so a status is never written to the wrong row.
export function buildMatcher(rows, getName, { threshold = 0.8, margin = 0.1 } = {}) {
  const exact = new Map();
  const indexed = rows.map((row) => {
    const n = normalizeName(getName(row));
    if (n && !exact.has(n)) exact.set(n, row);
    return { row, toks: tokens(getName(row)) };
  });
  return function match(name) {
    const n = normalizeName(name);
    if (!n) return null;
    if (exact.has(n)) return { row: exact.get(n), how: "exact" };
    const toks = tokens(name);
    let best = null, second = 0;
    for (const it of indexed) {
      const score = jaccard(toks, it.toks);
      if (!best || score > best.score) { second = best ? best.score : 0; best = { row: it.row, score }; }
      else if (score > second) second = score;
    }
    if (best && best.score >= threshold && best.score - second >= margin) return { row: best.row, how: "fuzzy", score: best.score };
    return null;
  };
}

// ---------- Folder names → document name + update type ----------

export const UPDATE_TYPES = {
  regular: { key: "regular", label: "Регулярний", code: "R" },
  mixed: { key: "mixed", label: "Змішаний", code: "M" },
  ad_hoc: { key: "ad_hoc", label: "Стихійний", code: "S" },
  not_applicable: { key: "not_applicable", label: "Не застосовується", code: "N" },
};

export function updateTypeFromLabel(label) {
  const n = normalizeName(label);
  if (!n) return null;
  if (n.startsWith("регуляр")) return UPDATE_TYPES.regular;
  if (n.startsWith("зміш")) return UPDATE_TYPES.mixed;
  if (n.startsWith("стихій")) return UPDATE_TYPES.ad_hoc;
  if (n.startsWith("не застос")) return UPDATE_TYPES.not_applicable;
  return null;
}

// "Бюджет закладу освіти [Регулярний]" → { name: "Бюджет закладу освіти", type: UPDATE_TYPES.regular }
export function parseFolderName(folderName) {
  const m = String(folderName).match(/^(.*?)\s*\[([^\[\]]+)\]\s*$/s);
  if (!m) return { name: String(folderName).trim(), typeLabel: null, type: null };
  return { name: m[1].trim(), typeLabel: m[2].trim(), type: updateTypeFromLabel(m[2]) };
}

// ---------- Relevance status vocabulary (column «Статус») ----------

// `label` is exactly what gets written into the sheet.
export const STATUSES = [
  { key: "up_to_date", label: "Оновлений" },
  { key: "outdated", label: "Застарілий" },
  { key: "broken_link", label: "Зміна сайту - посилання не працює" },
  { key: "missing", label: "Відсутній" },
  { key: "under_review", label: "На розгляді" },
];
const STATUS_BY_KEY = new Map(STATUSES.map((s) => [s.key, s]));

export function statusFromLabel(label) {
  const n = normalizeName(label);
  if (!n) return null;
  for (const s of STATUSES) if (normalizeName(s.label) === n) return s;
  // Tolerate small wording variations typed by hand.
  if (n.includes("посилання не працює")) return STATUS_BY_KEY.get("broken_link");
  if (n.startsWith("оновлен")) return STATUS_BY_KEY.get("up_to_date");
  if (n.startsWith("застар")) return STATUS_BY_KEY.get("outdated");
  if (n.startsWith("відсут")) return STATUS_BY_KEY.get("missing");
  if (n.startsWith("на розгляд")) return STATUS_BY_KEY.get("under_review");
  return null;
}

// Accepts either a status key ("outdated") or a sheet label ("Застарілий").
export function resolveStatus(input) {
  if (typeof input !== "string") return null;
  return STATUS_BY_KEY.get(input.trim()) || statusFromLabel(input);
}

// ---------- Period text ----------

// "—", "-", "" → null; otherwise the period with line breaks collapsed.
export function cleanPeriod(text) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim();
  return !t || /^[-–—]+$/.test(t) ? null : t;
}

// ---------- Deadline text → ISO date ----------

// Month stems (nominative and genitive both start with these).
const MONTHS = ["січ", "лют", "берез", "квіт", "трав", "черв", "лип", "серп", "верес", "жовт", "листоп", "груд"];
const SEASON_END = { весн: 5, літ: 8, осін: 11, осен: 11, зим: 2 }; // month (1-based) the season ends in
const QUARTERS = { i: 3, ii: 6, iii: 9, iv: 12, 1: 3, 2: 6, 3: 9, 4: 12 };

const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const endOfMonth = (y, m) => iso(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate());

function monthIndex(word) {
  for (let i = 0; i < MONTHS.length; i++) if (word.startsWith(MONTHS[i])) return i + 1;
  return 0;
}

// Turns the free-text «Найближче оновлення» cell into the LAST day of the window
// it describes, e.g. "Липень–вересень 2027" → "2027-09-30", "I квартал 2027" →
// "2027-03-31", "До 1 вересня 2027" → "2027-09-01". Returns null when the text
// has no concrete date ("Для кожної ОП своя дата…").
export function parseDueDate(text) {
  const s = String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return null;
  const yearMatch = s.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;

  // "до 1 вересня 2027"
  let m = s.match(/\b(\d{1,2})\s+([\p{L}]+)\s+(20\d{2})\b/u);
  if (m && monthIndex(m[2])) return iso(Number(m[3]), monthIndex(m[2]), Number(m[1]));

  // "i квартал 2027"
  m = s.match(/\b(iv|iii|ii|i|[1-4])\s*(?:-?й\s*)?квартал\w*\s+(20\d{2})/u);
  if (m) return endOfMonth(Number(m[2]), QUARTERS[m[1]]);

  // Month names: take the last month mentioned before the first year.
  const head = s.slice(0, s.indexOf(yearMatch[1]) + 4);
  const words = head.split(/[^\p{L}]+/u).filter(Boolean);
  const months = words.map(monthIndex).filter(Boolean);
  if (months.length) return endOfMonth(Number(yearMatch[1]), months[months.length - 1]);

  // "весна 2027"
  for (const w of words) for (const [stem, mon] of Object.entries(SEASON_END)) {
    if (w.startsWith(stem)) return endOfMonth(Number(yearMatch[1]) + (stem === "зим" ? 1 : 0), mon);
  }

  // "початок 2027"
  if (/початок|начало/.test(head)) return endOfMonth(Number(yearMatch[1]), 2);
  if (/кінець|кінця/.test(head)) return endOfMonth(Number(yearMatch[1]), 12);
  return null;
}

// ---------- Spreadsheet tables ----------

// Wraps raw `values` (array of rows) with header-based column access.
// `columns` maps keys → header text; a trailing "*" means "header starts with".
export function readTable(values, columns) {
  const [header = [], ...body] = values || [];
  const headerNorm = header.map(normalizeName);
  const idx = {};
  for (const [key, title] of Object.entries(columns)) {
    const prefix = title.endsWith("*");
    const want = normalizeName(prefix ? title.slice(0, -1) : title);
    idx[key] = headerNorm.findIndex((h) => (prefix ? h.startsWith(want) : h === want));
  }
  const rows = body.map((cells, i) => ({
    rowNumber: i + 2, // 1-based, after the header row
    get: (key) => (idx[key] >= 0 ? String(cells[idx[key]] ?? "").trim() : ""),
  })).filter((r) => r.get("name"));
  return { idx, rows, width: header.length };
}

// 0-based column index → A1 column letters.
export function columnLetter(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

export const quoteSheet = (name) => `'${String(name).replace(/'/g, "''")}'`;
