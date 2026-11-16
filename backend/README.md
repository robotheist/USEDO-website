# Backend — KSE public-information tracker

Node.js API that reads the Drive folder tree and the two spreadsheets, computes statuses, and writes status changes back to the table.

| Source | What it gives |
|---|---|
| Drive `Документи/` | 9 blocks = subfolders; documents = their subfolders `Назва [Тип]` |
| «Звіт по документах», column **Статус** | relevance status of each document (read **and written**) |
| … column **Відповідальний** | responsible person (read **and written**); the column **У кого знайти оновлений** is shown as a free-text note |
| … tab **Відповідальні** | the list of people offered in the «Відповідальний» dropdown (one name per row; add people here) |
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

**Server — Google Cloud Run.** See [Deploy to Cloud Run](#deploy-to-cloud-run) below.

**Check:** `GET /api/health` → `"source": "google"` and `"lastError": null`. A `403`/permission error almost always means step 3 (sharing) is missing.

Live mode is chosen automatically when credentials are found (gcloud login above, Cloud Run, or a key via env vars); force it with `DATA_SOURCE=google`.

## Deploy to Cloud Run

One container (see `Dockerfile` in the repo root) serves both the API and the frontend. The whole site sits behind Google sign-in (Identity-Aware Proxy) for KSE accounts; `ADMIN_TOKEN` additionally guards editing and lives in Secret Manager. No key files anywhere.

Prerequisites: the one-time setup from [Live data](#live-data-no-key-files), a **billing account linked** to the project (a service this size normally stays within the free tier), and the gcloud CLI. Commands are PowerShell, run from the **repo root**:

```powershell
$PROJECT = "<project-id>"
$SA      = "<service-account-email>"
$REGION  = "europe-central2"   # Warsaw

gcloud auth login
gcloud config set project $PROJECT
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com iap.googleapis.com
```

**1. Admin token → Secret Manager** (generated, never typed or committed)

```powershell
gcloud secrets create kse-docs-admin-token --replication-policy=automatic
node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))" | gcloud secrets versions add kse-docs-admin-token --data-file=-
gcloud secrets add-iam-policy-binding kse-docs-admin-token --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
```

Show it to hand to editors: `gcloud secrets versions access latest --secret=kse-docs-admin-token`. To rotate, add a new version and redeploy (step 2).

**2. Deploy** (re-run this to ship updates)

```powershell
gcloud beta run deploy kse-docs --source . --region $REGION --service-account $SA --no-allow-unauthenticated --iap --set-secrets "ADMIN_TOKEN=kse-docs-admin-token:latest" --max-instances 1 --timeout 3600
```

- `--max-instances 1`: the snapshot and live-update stream live in memory, so one instance keeps every viewer consistent. It still scales to zero when unused.
- `--timeout 3600`: live-update connections are recycled hourly instead of every 5 minutes (the browser reconnects automatically either way).

**3. Let KSE accounts in**

```powershell
$NUM = gcloud projects describe $PROJECT --format="value(projectNumber)"
gcloud beta services identity create --service=iap.googleapis.com
gcloud run services add-iam-policy-binding kse-docs --region $REGION --member="serviceAccount:service-$NUM@gcp-sa-iap.iam.gserviceaccount.com" --role=roles/run.invoker
gcloud iap web add-iam-policy-binding --resource-type=cloud-run --service=kse-docs --region=$REGION --member="domain:kse.org.ua" --role=roles/iap.httpsResourceAccessor
```

To allow only specific people instead of the whole domain, use `--member="user:name@kse.org.ua"` (repeat per person).

**4. Open** the `https://kse-docs-….run.app` URL printed by step 2 and sign in with a KSE account. `/api/health` should show `"source": "google"`.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Build fails with a permission error | Grant the build identity: `gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$NUM-compute@developer.gserviceaccount.com" --role=roles/run.builder`, then repeat step 2 |
| "You don't have access" after signing in | Step 3 not done, or signed in with a non-KSE account |
| Site shows data but `/api/health` has a `lastError` | The service account lost access to the folders/table (see Live data, step 3) |
| Logs | `gcloud run services logs read kse-docs --region $REGION` |

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
| `PATCH /api/documents/:id/owner` | body `{"owner": "Берзеніна", "expected": "Юдін"}` → writes the name into «Відповідальний». Only names from the «Відповідальні» tab are accepted (`""` clears); `expected` (the owner the page showed, `""` = none) is optional, mismatch → `409` with `current` |
| `GET /api/people` | the names from the «Відповідальні» tab (also in `snapshot.people`) |
| `GET /api/meta` · `/api/health` · `POST /api/refresh` | vocabularies · status · force re-read |

Block: `status` = `up_to_date` if every document except `[Не застосовується]` is up to date, otherwise `needs_renewal`.

Document:
```jsonc
{
  "id": "1zZeb…", "name": "Бюджет закладу освіти", "url": "https://drive.google.com/drive/folders/1zZeb…",
  "updateType": { "key": "regular", "label": "Регулярний", "code": "R" },
  "periodicity": { "periodic": true, "period": "Щороку", "label": "periodic: Щороку" },   // or "non-periodic"
  "relevance": { "upToDate": false, "status": "outdated", "statusLabel": "Застарілий", "owner": "Берзеніна", "ownerNote": null, "reportRow": 41 },
  "nextUpdate": { "label": "Січень 2027", "due": "2027-01-31", "daysLeft": 76, "overdue": false, "cycle": "Щороку" }
}
```
`relevance.ownerNote` is the «У кого знайти оновлений» text when it says more than the owner's name (e.g. "Висновок + інформація від Яковенко"), otherwise `null`. If the sheet has no «Відповідальний» column, that text is used as `owner` (read-only) and a warning is reported.

`relevance.status`: `up_to_date` · `outdated` · `broken_link` · `missing` · `under_review` · `not_in_report` (no row in the table) · `unknown` (unrecognised text) · `not_set` (empty cell).
`periodic` is true for `[Регулярний]` and `[Змішаний]`.

`snapshot.warnings` lists data problems: folders without `[Тип]`, documents missing from the table, table rows without a folder, type mismatches between folder name and «Періоди оновлення».
