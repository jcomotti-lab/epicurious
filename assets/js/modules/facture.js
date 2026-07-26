// Module Facture : sélection client + lignes produits, calcul HT/TVA/TTC,
// écriture dans DB - Articles vendus, puis rendu imprimable (window.print()).
import { SHEET_SCHEMAS } from "../config.js";
import { readSheet, appendRow } from "../sheets-api.js";

let produitsCache = null;
let clientsCache = null;
let lignes = [];

export async function render(container) {
  container.innerHTML = `<p class="loading">Chargement des produits et clients…</p>`;

  const [produits, clients] = await Promise.all([
    readSheet(SHEET_SCHEMAS.produits.sheetName),
    readSheet(SHEET_SCHEMAS.clients.sheetName),
  ]);
  produitsCache = produits;
  clientsCache = clients;
  lignes = [];

  const clientIdx = SHEET_SCHEMAS.clients.columns.findIndex((c) => c.key === "numero");
  const raisonIdx = SHEET_SCHEMAS.clients.columns.findIndex((c) => c.key === "raisonSociale");
  const clientOptions = clients.rows
    .map((r) => `<option value="${r.cells[clientIdx]}">${r.cells[clientIdx]} — ${r.cells[raisonIdx] || ""}</option>`)
    .join("");

  const refIdx = SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "reference");
  const nomIdx = SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "nomComplet");
  const produitOptions = produits.rows
    .map((r) => `<option value="${r.cells[refIdx]}">${r.cells[refIdx]} — ${r.cells[nomIdx] || ""}</option>`)
    .join("");

  container.innerHTML = `
    <div class="module-header"><h2>Nouvelle facture</h2></div>
    <form id="facture-form">
      <label>Client
        <select name="client" required>${clientOptions}</select>
      </label>

      <div class="facture-line">
        <select id="ligne-produit">${produitOptions}</select>
        <input id="ligne-qte" type="number" min="1" value="1" placeholder="Quantité">
        <input id="ligne-prix" type="number" step="0.01" placeholder="Prix unit. HT">
        <button type="button" id="btn-add-ligne">Ajouter la ligne</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Description</th><th>Qté</th><th>Prix unit. HT</th><th>Total HT</th><th></th></tr></thead>
          <tbody id="lignes-body"></tbody>
        </table>
      </div>

      <div id="totaux"></div>

      <div class="modal-actions">
        <button type="submit" class="btn-primary">Enregistrer et imprimer</button>
      </div>
    </form>
    <div id="facture-print" class="hidden"></div>
  `;

  container.querySelector("#btn-add-ligne").addEventListener("click", () => {
    const ref = container.querySelector("#ligne-produit").value;
    const qte = Number(container.querySelector("#ligne-qte").value) || 1;
    const prixInput = container.querySelector("#ligne-prix").value;
    const row = produits.rows.find((r) => r.cells[refIdx] === ref);
    const prixProIdx = SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "prixPro");
    const tvaIdx = SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "tva");
    const prix = prixInput ? Number(prixInput) : parseFloat(row?.cells[prixProIdx]) || 0;
    const tva = parseFloat(row?.cells[tvaIdx]) || 0;
    const categorie = row?.cells[SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "categorie")] || "";
    const contenance = row?.cells[SHEET_SCHEMAS.produits.columns.findIndex((c) => c.key === "contenance")] || "";
    const description = row?.cells[nomIdx] || ref;

    lignes.push({ ref, description, qte, prix, tva, categorie, contenance });
    renderLignes(container);
  });

  container.querySelector("#facture-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!lignes.length) return alert("Ajoutez au moins une ligne.");
    const clientId = container.querySelector("select[name=client]").value;
    try {
      const numero = await nextInvoiceNumber();
      for (const l of lignes) {
        await appendRow(SHEET_SCHEMAS.ventes.sheetName, SHEET_SCHEMAS.ventes.columns, {
          facture: numero,
          article: l.ref,
          quantite: l.qte,
          libelle: l.description,
          categorie: l.categorie,
          contenance: l.contenance,
        });
      }
      showPrintView(container, numero, clientId);
    } catch (err) {
      alert(`Erreur d'enregistrement : ${err.message}`);
    }
  });

  renderLignes(container);
}

function renderLignes(container) {
  const body = container.querySelector("#lignes-body");
  body.innerHTML = lignes
    .map(
      (l, i) => `
      <tr>
        <td>${l.ref}</td><td>${l.description}</td><td>${l.qte}</td>
        <td>${l.prix.toFixed(2)} CHF</td><td>${(l.prix * l.qte).toFixed(2)} CHF</td>
        <td><button type="button" data-i="${i}" class="btn-remove-ligne">×</button></td>
      </tr>`
    )
    .join("");

  body.querySelectorAll(".btn-remove-ligne").forEach((btn) => {
    btn.addEventListener("click", () => {
      lignes.splice(Number(btn.dataset.i), 1);
      renderLignes(container);
    });
  });

  const totalHT = lignes.reduce((s, l) => s + l.prix * l.qte, 0);
  const totalTVA = lignes.reduce((s, l) => s + l.prix * l.qte * (l.tva / 100), 0);
  container.querySelector("#totaux").innerHTML = `
    <p>Total HT : ${totalHT.toFixed(2)} CHF</p>
    <p>TVA : ${totalTVA.toFixed(2)} CHF</p>
    <p><strong>Total TTC : ${(totalHT + totalTVA).toFixed(2)} CHF</strong></p>
  `;
}

// Numérote au format AAAA.NN, en reprenant le dernier numéro de l'année en cours dans DB - Articles vendus.
async function nextInvoiceNumber() {
  const ventes = await readSheet(SHEET_SCHEMAS.ventes.sheetName);
  const factureIdx = SHEET_SCHEMAS.ventes.columns.findIndex((c) => c.key === "facture");
  const year = new Date().getFullYear();
  const seqs = ventes.rows
    .map((r) => r.cells[factureIdx])
    .filter((v) => v && v.startsWith(`${year}.`))
    .map((v) => Number(v.split(".")[1]) || 0);
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${year}.${next}`;
}

function showPrintView(container, numero, clientId) {
  const clientIdx = SHEET_SCHEMAS.clients.columns.findIndex((c) => c.key === "numero");
  const raisonIdx = SHEET_SCHEMAS.clients.columns.findIndex((c) => c.key === "raisonSociale");
  const client = clientsCache.rows.find((r) => r.cells[clientIdx] === clientId);
  const totalHT = lignes.reduce((s, l) => s + l.prix * l.qte, 0);
  const totalTVA = lignes.reduce((s, l) => s + l.prix * l.qte * (l.tva / 100), 0);

  const printDiv = container.querySelector("#facture-print");
  container.querySelector("#facture-form").classList.add("hidden");
  printDiv.classList.remove("hidden");
  printDiv.innerHTML = `
    <div class="facture-print">
      <h2>Epicurious brothers Sàrl</h2>
      <p>Avenue Pictet-De-Rochemont 15, 1207 Genève</p>
      <p>Facture n° ${numero} — ${new Date().toLocaleDateString("fr-CH")}</p>
      <p>Client : ${client ? client.cells[raisonIdx] : clientId}</p>
      <table>
        <thead><tr><th>Description</th><th>Qté</th><th>Prix unit. HT</th><th>Total HT</th></tr></thead>
        <tbody>${lignes.map((l) => `<tr><td>${l.description}</td><td>${l.qte}</td><td>${l.prix.toFixed(2)} CHF</td><td>${(l.prix * l.qte).toFixed(2)} CHF</td></tr>`).join("")}</tbody>
      </table>
      <p>Total HT : ${totalHT.toFixed(2)} CHF</p>
      <p>TVA : ${totalTVA.toFixed(2)} CHF</p>
      <p><strong>Total TTC : ${(totalHT + totalTVA).toFixed(2)} CHF</strong></p>
      <button onclick="window.print()" class="btn-primary no-print">Imprimer / Exporter en PDF</button>
    </div>
  `;
}
