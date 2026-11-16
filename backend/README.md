# Backend — KSE public-information tracker

Node.js API that reads the Drive folder tree and the two spreadsheets, computes statuses, and writes status changes back to the table.

| Source | What it gives |
|---|---|
| Drive `Документи/` | 9 blocks = subfolders; documents = their subfolders `Назва [Тип]` |
| «Звіт по документах», column **Статус** | relevance status of each document (read **and written**) |
| «Періоди оновлення документів КШЕ» → «Періоди оновлення» | period (`Щороку`, …) |
| … → «Регулярні — строки» | next update window → parsed into a due date |

Documents are linked to table rows **by name** (normalised: apostrophes, quotes, line breaks). Columns are found **by header text**, so reordering or inserting columns in the sheets doesn't break anything.

## Run

```bash
cd backend
npm install
npm start            # http://127.0.0.1:3000 — serves the API and the frontend
npm test
```

With no Google credentials it runs on `fixtures/` (a snapshot of the real data from 16.11.2026; writes stay in memory).

## Live data (no key files)

The backend uses Google's Application Default Credentials, so it needs **no service-account key file**. (KSE's organisation policy blocks key creation anyway.)

**One-time setup**

1. Google Cloud Console → create a project → enable **Google Drive API** and **Google Sheets API**.
2. *IAM & Admin → Service Accounts* → create a service account. Skip the optional role steps and **don't create a key**.
3. In Drive, share with the service account's e-mail like with a person:
   - the shared drive (or the «Документи» folder and the periods spreadsheet) — **Viewer**;
   - «Звіт по документах» — **Editor** (needed to write statuses back).

   If sharing outside the organisation's domain is restricted, a Drive admin has to allow it for this address.

**Local run — impersonation.** Your own Google login acts as the service account, no key involved.

1. On the service account → *Permissions* → grant **your own account** the role **Service Account Token Creator**.
2. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install) and run once:
   ```bash
   gcloud auth application-default login --impersonate-service-account=<service-account-email>
   ```
3. `npm start` — the log should say `loaded 9 blocks, … from "google"`.

**Server — Google Cloud Run.** Deploy `backend/` to Cloud Run and set the service account as the service's identity; Google supplies credentials automatically. Set `ADMIN_TOKEN` (and `CORS_ORIGINS` if the frontend is hosted elsewhere) as environment variables. Cloud Run needs a billing account on the project; a service this size normally stays within the free tier.

**Check:** `GET /api/health` → `"source": "google"` and `"lastError": null`. A `403`/permission error almost always means step 3 (sharing) is missing.

Live mode is chosen automatically when credentials are found (gcloud login above, Cloud Run, or a key via env vars); force it with `DATA_SOURCE=google`.

## Settings

| Env var | Default | |
|---|---|---|
| `PORT` | `3000` | |
| `DATA_SOURCE` | `google` if credentials are found, else `fixtures` | |
| `GOOGLE_APPLICATION_CREDENTIALS` / `GOOGLE_SERVICE_ACCOUNT_JSON` | — | only if you do use a key file / inline key JSON |
| `POLL_INTERVAL_MS` | `30000` | how fast table edits reach the site |
| `ADMIN_TOKEN` | — | if set, writes need `Authorization: Bearer …` |
| `CORS_ORIGINS` | `http://127.0.0.1:5180,http://localhost:5180` | for a separate frontend dev server |
| `SERVE_FRONTEND` | on | `0` to serve only `/api` |

IDs, sheet names and header texts are in `src/config.js`.

## API

| | |
|---|---|
| `GET /api/snapshot` | all blocks with documents (main call) |
| `GET /api/sections` · `/api/sections/:idOrSlug` | blocks / one block with documents |
| `GET /api/documents/:id` | one document (`id` = Drive folder ID) |
| `PATCH /api/documents/:id/status` | body `{"status": "up_to_date", "expected": "outdated"}` → writes the label into «Статус». `expected` is optional; on mismatch → `409` with `current` |
| `GET /api/events` | Server-Sent Events: `change` `{version}` whenever anything changes |
| `GET /api/meta` · `/api/health` · `POST /api/refresh` | vocabularies · status · force re-read |

Block: `status` = `up_to_date` if every document except `[Не застосовується]` is up to date, otherwise `needs_renewal`.

Document:
```jsonc
{
  "id": "1zZeb…", "name": "Бюджет закладу освіти", "url": "https://drive.google.com/drive/folders/1zZeb…",
  "updateType": { "key": "regular", "label": "Регулярний", "code": "R" },
  "periodicity": { "periodic": true, "period": "Щороку", "label": "periodic: Щороку" },   // or "non-periodic"
  "relevance": { "upToDate": false, "status": "outdated", "statusLabel": "Застарілий", "owner": "Берзеніна", "reportRow": 41 },
  "nextUpdate": { "label": "Січень 2027", "due": "2027-01-31", "daysLeft": 76, "overdue": false, "cycle": "Щороку" }
}
```
`relevance.status`: `up_to_date` · `outdated` · `broken_link` · `missing` · `under_review` · `not_in_report` (no row in the table) · `unknown` (unrecognised text) · `not_set` (empty cell).
`periodic` is true for `[Регулярний]` and `[Змішаний]`.

`snapshot.warnings` lists data problems: folders without `[Тип]`, documents missing from the table, table rows without a folder, type mismatches between folder name and «Періоди оновлення».
