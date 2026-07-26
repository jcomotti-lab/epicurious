// Configuration du classeur Google Sheets et des colonnes de chaque feuille.
// À adapter : GOOGLE_CLIENT_ID doit être créé dans Google Cloud Console
// (OAuth Client ID de type "Web", origine JavaScript autorisée = l'URL GitHub Pages du site).

export const SPREADSHEET_ID = "18fsejmbwPXwv9PwJB1cUD1bB1CKBOa67Gb2fuoPaSM8";

export const GOOGLE_CLIENT_ID = "763248740872-kl54h04cgdlr9qganmeiqrpbuaflk8l5.apps.googleusercontent.com";

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

// Définition des feuilles gérées en CRUD (lecture + ajout + édition) par l'interface.
// `columns` reprend l'ordre exact des colonnes existantes dans le Google Sheet.
export const SHEET_SCHEMAS = {
  produits: {
    sheetName: "DB - Produits",
    label: "Produits",
    columns: [
      { key: "reference", header: "Référence", type: "text", required: true },
      { key: "statut", header: "Statut", type: "select", options: ["Disponible", "Indisponible"] },
      { key: "type", header: "Type", type: "text" },
      { key: "marque", header: "Marque", type: "text", required: true },
      { key: "description", header: "Modèle/Description", type: "text" },
      { key: "annee", header: "Année", type: "number" },
      { key: "pays", header: "Pays", type: "text" },
      { key: "contenance", header: "Contenance", type: "number", step: "0.01" },
      { key: "unite", header: "Unité de mesure", type: "text" },
      { key: "volumePct", header: "Volume %", type: "number", step: "0.1" },
      { key: "categorie", header: "Catégorie", type: "text" },
      { key: "tva", header: "TVA", type: "number", step: "0.1" },
      { key: "cout", header: "Coût", type: "number", step: "0.01" },
      { key: "prixPro", header: "Prix professionnel HT", type: "number", step: "0.01" },
      { key: "prixAutres", header: "Prix autres HT", type: "number", step: "0.01" },
      { key: "prixPublic", header: "Prix public HT", type: "number", step: "0.01" },
      { key: "prixPublic2", header: "Prix public 2 HT", type: "number", step: "0.01" },
      { key: "nomComplet", header: "Nom complet", type: "text", readOnly: true },
    ],
    idKey: "reference",
  },

  clients: {
    sheetName: "DB - Clients",
    label: "Clients",
    columns: [
      { key: "numero", header: "N° client", type: "text", required: true },
      { key: "categorie", header: "Catégorie", type: "text" },
      { key: "raisonSociale", header: "Raison sociale", type: "text", required: true },
      { key: "adresse", header: "Adresse", type: "text" },
      { key: "codePostal", header: "Code postal", type: "text" },
      { key: "ville", header: "Ville", type: "text" },
      { key: "pays", header: "Pays", type: "text" },
      { key: "prenom", header: "Prénom", type: "text" },
      { key: "nom", header: "Nom", type: "text" },
      { key: "telephone", header: "N° téléphone", type: "text" },
      { key: "statut", header: "Statut", type: "select", options: ["Actif", "Inactif"] },
    ],
    idKey: "numero",
  },

  fournisseurs: {
    sheetName: "Fournisseurs",
    label: "Fournisseurs",
    columns: [
      { key: "nom", header: "Nom", type: "text", required: true },
      { key: "email", header: "Email", type: "email" },
    ],
    idKey: "nom",
  },

  achats: {
    sheetName: "DB - Articles achetés",
    label: "Achats",
    columns: [
      { key: "date", header: "Date", type: "date", required: true },
      { key: "article", header: "N° article", type: "text", required: true },
      { key: "quantite", header: "Quantité", type: "number", required: true },
      { key: "libelle", header: "Libellé", type: "text" },
      { key: "categorie", header: "Catégorie", type: "text" },
      { key: "contenance", header: "Contenance", type: "number", step: "0.01" },
    ],
  },

  ventes: {
    sheetName: "DB - Articles vendus",
    label: "Ventes",
    columns: [
      { key: "facture", header: "N° facture", type: "text", required: true },
      { key: "article", header: "N° article", type: "text", required: true },
      { key: "quantite", header: "Quantité", type: "number", required: true },
      { key: "libelle", header: "Libellé", type: "text" },
      { key: "categorie", header: "Catégorie", type: "text" },
      { key: "contenance", header: "Contenance", type: "number", step: "0.01" },
    ],
  },
};

// Feuilles de reporting affichées en lecture seule (agrégats déjà calculés dans le Sheet).
export const REPORT_SHEETS = {
  volumes: { sheetName: "Vendus L Achetés L", label: "Volumes" },
  inventaireViticole: { sheetName: "Inventaire viticole", label: "Inventaire viticole" },
  inventaireAnnuel: { sheetName: "Inventaire 31.12.24", label: "Inventaire annuel" },
};
