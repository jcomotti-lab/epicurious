// Rendu générique d'une feuille de reporting en lecture seule : tableau brut +
// graphique en barres optionnel si des colonnes "litres vendus / achetés" sont détectées.
import { readSheet } from "../sheets-api.js";

const COLOR_VENDUS = "#3b6fb6";
const COLOR_ACHETE = "#d68a3b";

export async function renderReportModule(container, { sheetName, label }) {
  container.innerHTML = `<p class="loading">Chargement de « ${label} »…</p>`;

  let sheet;
  try {
    sheet = await readSheet(sheetName);
  } catch (err) {
    container.innerHTML = `<p class="error">Erreur de chargement : ${err.message}</p>`;
    return;
  }

  const rows = sheet.rows.filter((r) => r.cells.some((c) => c !== ""));
  const vendusIdx = sheet.header.findIndex((h) => /vendus.*l/i.test(h));
  const acheteIdx = sheet.header.findIndex((h) => /achet.*l/i.test(h));
  const categorieIdx = sheet.header.findIndex((h) => /cat[ée]gorie/i.test(h));

  const chartHtml =
    vendusIdx >= 0 && acheteIdx >= 0 && categorieIdx >= 0 ? buildChart(rows, categorieIdx, vendusIdx, acheteIdx) : "";

  const headHtml = `<tr>${sheet.header.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const bodyHtml = rows
    .map((r) => `<tr>${sheet.header.map((_, i) => `<td>${r.cells[i] ?? ""}</td>`).join("")}</tr>`)
    .join("");

  container.innerHTML = `
    <div class="module-header"><h2>${label}</h2></div>
    ${chartHtml}
    <div class="table-wrap">
      <table><thead>${headHtml}</thead><tbody>${bodyHtml || `<tr><td>Aucune donnée.</td></tr>`}</tbody></table>
    </div>
  `;
}

function buildChart(rows, categorieIdx, vendusIdx, acheteIdx) {
  const data = rows
    .map((r) => ({
      categorie: r.cells[categorieIdx] || "",
      vendus: parseFloat(String(r.cells[vendusIdx]).replace(",", ".")) || 0,
      achete: parseFloat(String(r.cells[acheteIdx]).replace(",", ".")) || 0,
    }))
    .filter((d) => d.categorie && (d.vendus || d.achete));

  if (!data.length) return "";
  const max = Math.max(...data.map((d) => Math.max(d.vendus, d.achete)), 1);

  const bars = data
    .map(
      (d) => `
      <div class="chart-row">
        <span class="chart-label">${d.categorie}</span>
        <div class="chart-bars">
          <div class="chart-bar" style="width:${(d.vendus / max) * 100}%; background:${COLOR_VENDUS}" title="Vendus : ${d.vendus} L"></div>
          <div class="chart-bar" style="width:${(d.achete / max) * 100}%; background:${COLOR_ACHETE}" title="Achetés : ${d.achete} L"></div>
        </div>
      </div>`
    )
    .join("");

  return `
    <div class="chart">
      <div class="chart-legend">
        <span><i style="background:${COLOR_VENDUS}"></i>Litres vendus</span>
        <span><i style="background:${COLOR_ACHETE}"></i>Litres achetés</span>
      </div>
      ${bars}
    </div>`;
}
