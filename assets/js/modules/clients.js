import { renderCrudModule } from "../components/crud-table.js";
import { SHEET_SCHEMAS } from "../config.js";
import { readSheet, ensureSheetExists, appendRow } from "../sheets-api.js";

export function render(container) {
  container.innerHTML = `
    <div class="subtabs">
      <button class="subtab active" data-tab="clients">Clients</button>
      <button class="subtab" data-tab="fournisseurs">Fournisseurs</button>
    </div>
    <div id="subtab-content"></div>
  `;
  const content = container.querySelector("#subtab-content");
  renderCrudModule(content, SHEET_SCHEMAS.clients);

  container.querySelectorAll(".subtab").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".subtab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      if (btn.dataset.tab === "clients") {
        renderCrudModule(content, SHEET_SCHEMAS.clients);
      } else {
        renderFournisseurs(content);
      }
    });
  });
}

async function renderFournisseurs(content) {
  content.innerHTML = `
    <div class="module-header">
      <button id="btn-seed" class="btn-secondary">Initialiser depuis DB - Produits</button>
    </div>
    <div id="fournisseurs-table"></div>
  `;
  const table = content.querySelector("#fournisseurs-table");
  renderCrudModule(table, SHEET_SCHEMAS.fournisseurs);

  content.querySelector("#btn-seed").addEventListener("click", async () => {
    try {
      await seedFournisseurs();
      renderCrudModule(table, SHEET_SCHEMAS.fournisseurs);
    } catch (err) {
      alert(`Erreur d'initialisation : ${err.message}`);
    }
  });
}

// Lit la colonne "Marque" (D) de DB - Produits, déduplique, et crée une ligne
// (Nom, Email vide) dans Fournisseurs pour chaque marque absente.
async function seedFournisseurs() {
  const schema = SHEET_SCHEMAS.fournisseurs;
  await ensureSheetExists(schema.sheetName, schema.columns.map((c) => c.header));

  const produits = await readSheet(SHEET_SCHEMAS.produits.sheetName);
  const marqueIdx = SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "marque");
  const marques = [...new Set(produits.rows.map((r) => r.cells[marqueIdx]).filter(Boolean))];

  const existing = await readSheet(schema.sheetName);
  const nomIdx = schema.columns.findIndex((c) => c.key === "nom");
  const existingNoms = new Set(existing.rows.map((r) => r.cells[nomIdx]));

  const toAdd = marques.filter((m) => !existingNoms.has(m));
  for (const nom of toAdd) {
    await appendRow(schema.sheetName, schema.columns, { nom, email: "" });
  }
  if (!toAdd.length) alert("Aucun nouveau fournisseur à ajouter — la liste est déjà à jour.");
}
