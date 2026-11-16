// Live Google Drive + Sheets access as a service account, via Application
// Default Credentials: gcloud impersonation locally, the attached identity on
// Cloud Run, or (optionally) a key file. See backend/README.md → "Live data".
// The service account needs Viewer on the folders and Editor on
// «Звіт по документах» (to write statuses back).

import { google } from "googleapis";
import { quoteSheet } from "../parse.js";

export function createGoogleSource() {
  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
  ];
  const auth = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? new google.auth.GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), scopes })
    : new google.auth.GoogleAuth({ scopes });
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  return {
    name: "google",

    async listChildFolders(parentId) {
      const out = [];
      let pageToken;
      do {
        const { data } = await drive.files.list({
          q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "nextPageToken, files(id, name)",
          orderBy: "name",
          pageSize: 1000,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          corpora: "allDrives",
        });
        out.push(...(data.files || []).map((f) => ({ id: f.id, name: f.name })));
        pageToken = data.nextPageToken;
      } while (pageToken);
      return out;
    },

    async getValues(spreadsheetId, sheet) {
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: quoteSheet(sheet),
        valueRenderOption: "FORMATTED_VALUE",
      });
      return data.values || [];
    },

    // RAW so a value can never be interpreted as a formula.
    async updateValue(spreadsheetId, sheet, a1, value) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheet(sheet)}!${a1}`,
        valueInputOption: "RAW",
        requestBody: { values: [[value]] },
      });
    },

    async appendRow(spreadsheetId, sheet, row) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: quoteSheet(sheet),
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] },
      });
    },
  };
}
