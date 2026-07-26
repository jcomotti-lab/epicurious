const MODULES = [
  { hash: "produits", label: "Produits", desc: "Catalogue, prix et coûts." },
  { hash: "clients", label: "Clients", desc: "Clients et fournisseurs." },
  { hash: "volumes", label: "Volumes", desc: "Litres vendus / achetés par catégorie." },
  { hash: "inventaire-viticole", label: "Inventaire viticole", desc: "Ventes en litres par catégorie viticole." },
  { hash: "achats", label: "Achats", desc: "Articles achetés." },
  { hash: "ventes", label: "Ventes", desc: "Articles vendus." },
  { hash: "inventaire-annuel", label: "Inventaire annuel", desc: "Stock et valeur au prix coûtant." },
  { hash: "facture", label: "Facture", desc: "Créer une nouvelle facture." },
];

export function render(container) {
  container.innerHTML = `
    <div class="module-header"><h2>Accueil</h2></div>
    <div class="home-grid">
      ${MODULES.map(
        (m) => `
        <a class="home-card" href="#${m.hash}">
          <h3>${m.label}</h3>
          <p>${m.desc}</p>
        </a>`
      ).join("")}
    </div>
  `;
}
