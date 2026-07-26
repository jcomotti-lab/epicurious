// Wrapper générique autour de l'API Google Sheets v4 (lecture/ajout/mise à jour de lignes).
import { SPREADSHEET_ID } from "./config.js";
import { getAccessToken } from "./auth.js";

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function columnLetter(index) {
  // index 0-based -> "A", 1 -> "B", ... 26 -> "AA"
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error("Non connecté à Google.");
  const res = await fetch(`${API_BASE}/${SPREADSHEET_ID}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erreur Google Sheets API (${res.status}) : ${body}`);
  }
  return res.json();
}

// Lit toute une feuille : { header: string[], rows: [{ rowIndex, cells: string[] }] }
// rowIndex est le numéro de ligne réel dans le Sheet (1 = header, 2 = première donnée).
export async function readSheet(sheetName) {
  const range = encodeURIComponent(`${sheetName}!A1:ZZ`);
  const data = await apiFetch(`/values/${range}`);
  const values = data.values || [];
  const header = values[0] || [];
  const rows = values.slice(1).map((cells, i) => ({ rowIndex: i + 2, cells }));
  return { header, rows };
}

// Ajoute une ligne à la fin de la feuille, dans l'ordre des `columns` fourni (schéma de config.js).
export async function appendRow(sheetName, columns, rowObject) {
  const values = columns.map((c) => rowObject[c.key] ?? "");
  const range = encodeURIComponent(`${sheetName}!A1`);
  await apiFetch(`/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: "POST",
    body: JSON.stringify({ values: [values] }),
  });
}

// Met à jour une ligne existante (rowIndex = numéro de ligne réel dans le Sheet).
export async function updateRow(sheetName, columns, rowIndex, rowObject) {
  const values = columns.map((c) => rowObject[c.key] ?? "");
  const lastCol = columnLetter(columns.length - 1);
  const range = encodeURIComponent(`${sheetName}!A${rowIndex}:${lastCol}${rowIndex}`);
  await apiFetch(`/values/${range}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [values] }),
  });
}

// Crée un nouvel onglet s'il n'existe pas encore (utilisé pour "Fournisseurs").
export async function ensureSheetExists(sheetName, headerRow) {
  const meta = await apiFetch("");
  const exists = meta.sheets.some((s) => s.properties.title === sheetName);
  if (exists) return;
  await apiFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName } } }] }),
  });
  const range = encodeURIComponent(`${sheetName}!A1`);
  await apiFetch(`/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: "POST",
    body: JSON.stringify({ values: [headerRow] }),
  });
}
