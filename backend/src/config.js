// All IDs, sheet names and column headers live here so a renamed sheet/column
// is a one-line change. Columns are located by HEADER TEXT, not by letter, so
// inserting or reordering columns in the spreadsheets does not break anything.

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const env = process.env;

// Live mode is chosen automatically when any Google credentials are available:
// a key (env vars), keyless gcloud login / impersonation (the ADC file), or
// Google Cloud hosting such as Cloud Run (K_SERVICE is set there).
const adcFile = env.APPDATA
  ? join(env.APPDATA, "gcloud", "application_default_credentials.json")
  : join(homedir(), ".config", "gcloud", "application_default_credentials.json");
const hasGoogleCreds = Boolean(
  env.GOOGLE_APPLICATION_CREDENTIALS || env.GOOGLE_SERVICE_ACCOUNT_JSON || env.K_SERVICE || existsSync(adcFile),
);

export const config = {
  port: Number(env.PORT || 3000),

  // "google" — live Drive/Sheets API; "fixtures" — local JSON snapshot (no credentials needed).
  dataSource: env.DATA_SOURCE || (hasGoogleCreds ? "google" : "fixtures"),

  // How often the backend re-reads Drive + Sheets to pick up edits made directly in the table.
  pollIntervalMs: Number(env.POLL_INTERVAL_MS || 30_000),

  // If set, PATCH/POST endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.
  // Trimmed: secrets stored from a shell often carry a trailing newline.
  adminToken: (env.ADMIN_TOKEN || "").trim(),

  // Comma-separated list of origins allowed to call the API from a browser.
  corsOrigins: (env.CORS_ORIGINS || "http://127.0.0.1:5180,http://localhost:5180")
    .split(",").map((s) => s.trim()).filter(Boolean),

  // Serve the static frontend (index.html, app.js, …) from the repo root.
  serveFrontend: env.SERVE_FRONTEND !== "0",

  // «Документи» — its direct subfolders are the blocks, their subfolders are the documents.
  documentsFolderId: env.DOCUMENTS_FOLDER_ID || "1awFZGigqGekfTfcXr-9xR_Akbq0k9wCj",

  // «Звіт по документах» — source of truth for each document's relevance status.
  report: {
    spreadsheetId: env.REPORT_SPREADSHEET_ID || "15j921px4mPbQ0uVL1_bbc4HyBvSd2qnWwSo3hwcye18",
    sheet: env.REPORT_SHEET || "Sheet1",
    columns: {
      name: "Назва документу",
      status: "Статус",
      owner: "У кого знайти оновлений",
      action: "Рекомендована дія",
    },
  },

  // «Періоди оновлення документів КШЕ»
  periods: {
    spreadsheetId: env.PERIODS_SPREADSHEET_ID || "1my11xA8bGr8ckBxJ6zRrHt55bAfARtjU1ibsv-8aGgI",
    sheet: env.PERIODS_SHEET || "Періоди оновлення",
    columns: {
      name: "Назва документу",
      type: "Тип оновлення",
      period: "Період",
      trigger: "Коли / тригер оновлення",
    },
  },
  deadlines: {
    spreadsheetId: env.PERIODS_SPREADSHEET_ID || "1my11xA8bGr8ckBxJ6zRrHt55bAfARtjU1ibsv-8aGgI",
    sheet: env.DEADLINES_SHEET || "Регулярні — строки",
    columns: {
      name: "Назва документу",
      cycle: "Цикл",
      rule: "Конкретний строк оновлення",
      // Header is "Найближче оновлення (від 09.11.2026)" — matched by prefix.
      next: "Найближче оновлення*",
    },
  },

  // Optional stable slugs for the blocks (the frontend uses these in URLs).
  // Unknown/new blocks fall back to their Drive folder ID.
  sectionSlugs: {
    "Вступна кампанія": "admission",
    "Фінансові питання": "finance",
    "Освітній процес": "education",
    "Операційні питання": "operations",
    "Загальні політики": "policies",
    "Кадрові питання": "hr",
    "Виховні процеси": "upbringing",
    "Наука та аспірантура": "science",
    "Студентське самоврядування": "selfgov",
  },
};
