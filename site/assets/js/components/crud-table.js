// Rendu générique d'un module CRUD : table + bouton "Nouveau" + modale d'édition,
// piloté par un schéma de colonnes (voir config.js SHEET_SCHEMAS).
import { readSheet, appendRow, updateRow } from "../sheets-api.js";
import { openModal, closeModal } from "./modal.js";

export async function renderCrudModule(container, schema) {
  container.innerHTML = `<p class="loading">Chargement de « ${schema.label} »…</p>`;

  let sheet;
  try {
    sheet = await readSheet(schema.sheetName);
  } catch (err) {
    container.innerHTML = `<p class="error">Erreur de chargement : ${err.message}</p>`;
    return;
  }

  const editableCols = schema.columns.filter((c) => !c.readOnly);

  const rowsHtml = sheet.rows
    .filter((r) => r.cells.some((c) => c !== ""))
    .map((r) => {
      const cells = schema.columns.map((_, i) => `<td>${r.cells[i] ?? ""}</td>`).join("");
      return `<tr data-row="${r.rowIndex}">${cells}<td><button class="btn-edit" data-row="${r.rowIndex}">Modifier</button></td></tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="module-header">
      <h2>${schema.label}</h2>
      <button id="btn-new" class="btn-primary">+ Nouveau</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>${schema.columns.map((c) => `<th>${c.header}</th>`).join("")}<th></th></tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${schema.columns.length + 1}">Aucune donnée.</td></tr>`}</tbody>
      </table>
    </div>
  `;

  container.querySelector("#btn-new").addEventListener("click", () => openForm(null));

  container.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rowIndex = Number(btn.dataset.row);
      const row = sheet.rows.find((r) => r.rowIndex === rowIndex);
      openForm(row);
    });
  });

  function openForm(existingRow) {
    const values = existingRow
      ? Object.fromEntries(schema.columns.map((c, i) => [c.key, existingRow.cells[i] ?? ""]))
      : {};

    const fieldsHtml = editableCols
      .map((c) => {
        const value = values[c.key] ?? "";
        if (c.type === "select") {
          const opts = c.options
            .map((o) => `<option value="${o}" ${o === value ? "selected" : ""}>${o}</option>`)
            .join("");
          return `<label>${c.header}<select name="${c.key}">${opts}</select></label>`;
        }
        return `<label>${c.header}<input name="${c.key}" type="${c.type}" ${c.step ? `step="${c.step}"` : ""} value="${value}" ${c.required ? "required" : ""}></label>`;
      })
      .join("");

    openModal(`
      <h3>${existingRow ? "Modifier" : "Nouveau"} — ${schema.label}</h3>
      <form id="crud-form">${fieldsHtml}
        <div class="modal-actions">
          <button type="button" id="btn-cancel">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `);

    document.getElementById("btn-cancel").addEventListener("click", closeModal);
    document.getElementById("crud-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const rowObject = Object.fromEntries(editableCols.map((c) => [c.key, formData.get(c.key) ?? ""]));

      if (schema.columns.some((c) => c.key === "nomComplet")) {
        rowObject.nomComplet = buildNomComplet(rowObject);
      }

      try {
        if (existingRow) {
          await updateRow(schema.sheetName, schema.columns, existingRow.rowIndex, rowObject);
        } else {
          await appendRow(schema.sheetName, schema.columns, rowObject);
        }
        closeModal();
        renderCrudModule(container, schema);
      } catch (err) {
        alert(`Erreur d'enregistrement : ${err.message}`);
      }
    });
  }
}

// Reconstruit "Nom complet" sur le même modèle que les lignes existantes de DB - Produits :
// "{Marque} - {Description} - {Année} - {Contenance}L - {Volume%/100}"
function buildNomComplet(row) {
  const volume = row.volumePct ? (Number(row.volumePct) / 100).toString() : "";
  return [row.marque, row.description, row.annee, row.contenance ? `${row.contenance}L` : "", volume]
    .filter(Boolean)
    .join(" - ");
}
