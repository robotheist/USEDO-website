// Joins the Drive folder tree with the three spreadsheet tabs into the API model.
// Pure function of its inputs — no I/O — so it is easy to test.

import {
  buildMatcher, cleanPeriod, normalizeName, parseDueDate, parseFolderName, readTable, statusFromLabel, UPDATE_TYPES,
} from "./parse.js";

// Names from the «Відповідальні» tab, in sheet order, without blanks/duplicates.
export function readPeople(values, cfg) {
  const seen = new Set();
  return readTable(values, cfg.people.columns).rows
    .map((r) => r.get("name").replace(/\s+/g, " ").trim())
    .filter((n) => n && !seen.has(normalizeName(n)) && seen.add(normalizeName(n)));
}

// Owner of a report row: the «Відповідальний» column; if the sheet doesn't
// have it yet, the old free-text column. The note is the free-text column,
// dropped when it only repeats the owner's name.
export function ownerOf(row, idx) {
  const note = row.get("ownerNote").replace(/\s+/g, " ").trim();
  const owner = idx.owner >= 0 ? row.get("owner").replace(/\s+/g, " ").trim() : note;
  const ownerNote = idx.owner >= 0 && note && normalizeName(note) !== normalizeName(owner) ? note : null;
  return { owner: owner || null, ownerNote, note: note || null };
}

const DRIVE_FOLDER = (id) => `https://drive.google.com/drive/folders/${id}`;
const DAY = 86_400_000;

/**
 * @param raw {
 *   sections: [{id, name}],                 // subfolders of «Документи»
 *   folders:  { [sectionId]: [{id, name}] }, // document folders per block
 *   report, periods, deadlines: string[][]   // raw sheet values
 * }
 * @param cfg  the app config (for column headers and slugs)
 * @param today  Date used for deadline maths
 */
export function buildModel(raw, cfg, today = new Date()) {
  const warnings = [];
  const report = readTable(raw.report, cfg.report.columns);
  const periods = readTable(raw.periods, cfg.periods.columns);
  const deadlines = readTable(raw.deadlines, cfg.deadlines.columns);

  if (report.idx.name < 0 || report.idx.status < 0) {
    throw new Error(`Report sheet is missing the "${cfg.report.columns.name}" or "${cfg.report.columns.status}" column`);
  }
  if (report.idx.owner < 0) {
    warnings.push({ code: "owner_column_missing", message: `Column "${cfg.report.columns.owner}" not found in «Звіт по документах»; using "${cfg.report.columns.ownerNote}" as the owner (read-only)` });
  }
  const people = readPeople(raw.people || [], cfg);
  const known = new Set(people.map(normalizeName));

  const matchReport = buildMatcher(report.rows, (r) => r.get("name"));
  const matchPeriod = buildMatcher(periods.rows, (r) => r.get("name"));
  const matchDeadline = buildMatcher(deadlines.rows, (r) => r.get("name"));
  const usedReportRows = new Set();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const sections = raw.sections.map((sec, order) => {
    const documents = (raw.folders[sec.id] || []).map((folder) => {
      const parsed = parseFolderName(folder.name);
      if (!parsed.type) warnings.push({ code: "folder_without_type", documentId: folder.id, message: `Folder "${folder.name}" has no recognised [Тип] suffix` });

      // --- relevance (from «Звіт по документах») ---
      const rep = matchReport(parsed.name);
      if (rep) usedReportRows.add(rep.row.rowNumber);
      else warnings.push({ code: "not_in_report", documentId: folder.id, message: `"${parsed.name}" has no row in «Звіт по документах»` });
      const rawStatus = rep ? rep.row.get("status") : "";
      const status = statusFromLabel(rawStatus);
      if (rep && !status) warnings.push({ code: "unknown_status", documentId: folder.id, message: `Unrecognised status "${rawStatus}" for "${parsed.name}"` });
      const statusKey = !rep ? "not_in_report" : status ? status.key : rawStatus ? "unknown" : "not_set";
      const { owner, ownerNote, note } = rep ? ownerOf(rep.row, report.idx) : { owner: null, ownerNote: null, note: null };
      if (owner && report.idx.owner >= 0 && people.length && !known.has(normalizeName(owner))) {
        warnings.push({ code: "owner_not_in_list", documentId: folder.id, message: `"${parsed.name}": «${owner}» is not in the «${cfg.people.sheet}» tab` });
      }

      // --- periodicity (type from the folder name, period from «Періоди оновлення») ---
      const per = matchPeriod(parsed.name);
      const period = per ? cleanPeriod(per.row.get("period")) : null;
      const sheetType = per ? parseFolderName(`x [${per.row.get("type")}]`).type : null;
      if (per && parsed.type && sheetType && sheetType.key !== parsed.type.key) {
        warnings.push({ code: "type_mismatch", documentId: folder.id, message: `"${parsed.name}": folder says ${parsed.type.label}, «Періоди оновлення» says ${sheetType.label}` });
      }
      const type = parsed.type || sheetType;
      const periodic = type === UPDATE_TYPES.regular || type === UPDATE_TYPES.mixed;
      if (periodic && !period) warnings.push({ code: "periodic_without_period", documentId: folder.id, message: `"${parsed.name}" is ${type.label} but has no period in «Періоди оновлення»` });

      // --- next deadline (from «Регулярні — строки») ---
      const dl = periodic ? matchDeadline(parsed.name) : null;
      let nextUpdate = null;
      if (dl) {
        const label = dl.row.get("next").replace(/\s+/g, " ").trim() || null;
        const due = parseDueDate(label);
        const daysLeft = due ? Math.round((Date.parse(due + "T00:00:00Z") - todayUtc) / DAY) : null;
        nextUpdate = { label, due, daysLeft, overdue: daysLeft !== null && daysLeft < 0, cycle: dl.row.get("cycle").replace(/\s+/g, " ").trim() || null };
      }

      return {
        id: folder.id,
        sectionId: sec.id,
        name: parsed.name,
        folderName: folder.name,
        url: DRIVE_FOLDER(folder.id),
        updateType: type ? { key: type.key, label: type.label, code: type.code } : null,
        periodicity: {
          periodic,
          period,
          label: periodic ? `periodic: ${period || "?"}` : "non-periodic",
          trigger: per ? per.row.get("trigger").replace(/\s+/g, " ").trim() || null : null,
        },
        relevance: {
          upToDate: statusKey === "up_to_date",
          status: statusKey,
          statusLabel: rawStatus || null,
          owner,
          ownerNote, // note to display: null when it only repeats the owner's name
          note, // the «У кого знайти оновлений» cell as it is (what editing starts from)
          action: rep ? rep.row.get("action") || null : null,
          reportRow: rep ? rep.row.rowNumber : null,
        },
        notApplicable: type === UPDATE_TYPES.not_applicable,
        nextUpdate,
      };
    });

    // A block is up to date iff every applicable document in it is up to date.
    // [Не застосовується] documents are legal notes, not publications, so they
    // never pull a block down.
    const applicable = documents.filter((d) => !d.notApplicable);
    const upToDate = applicable.filter((d) => d.relevance.upToDate).length;
    return {
      id: sec.id,
      slug: cfg.sectionSlugs[sec.name] || sec.id,
      name: sec.name,
      order,
      url: DRIVE_FOLDER(sec.id),
      status: upToDate === applicable.length ? "up_to_date" : "needs_renewal",
      empty: documents.length === 0,
      counts: {
        total: documents.length,
        applicable: applicable.length,
        upToDate,
        needsRenewal: applicable.length - upToDate,
        notApplicable: documents.length - applicable.length,
      },
      documents,
    };
  });

  for (const row of report.rows) {
    if (!usedReportRows.has(row.rowNumber)) {
      warnings.push({ code: "report_row_without_folder", reportRow: row.rowNumber, message: `Row ${row.rowNumber} "${row.get("name")}" in «Звіт по документах» has no matching folder in Drive` });
    }
  }

  return { sections, people, warnings };
}
