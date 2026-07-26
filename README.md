# Epicurious Brothers — Interface de gestion (Phase 1)

Interface web (single-page app statique) pour gérer le classeur Google Sheets de l'activité : Produits, Clients, Fournisseurs, Volumes, Inventaire viticole, Achats, Ventes, Inventaire annuel, et création de Factures.

Aucun serveur applicatif : le site s'authentifie directement en OAuth Google dans le navigateur et lit/écrit le Google Sheet via l'API Sheets v4.

## 1. Créer l'OAuth Client ID Google (à faire une fois)

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/) → créer un projet (ou utiliser un projet existant).
2. Activer l'**API Google Sheets** (menu "API et services" → "Bibliothèque").
3. "API et services" → "Identifiants" → "Créer des identifiants" → **ID client OAuth** → type **Application Web**.
4. Dans "Origines JavaScript autorisées", ajouter l'URL du site une fois publié sur GitHub Pages, ex. `https://<votre-utilisateur>.github.io`.
5. Copier le Client ID généré (`....apps.googleusercontent.com`).
6. **Autoriser les comptes qui doivent pouvoir se connecter** : "API et services" → "Écran de consentement OAuth" → section **Utilisateurs test** (tant que l'app reste en statut "Testing", ce qui est recommandé pour un usage interne — évite la vérification Google requise en "En production" pour le scope Sheets). Ajouter `info@epicurious.ch` et `jcomotti@gmail.com` : sans ça, Google refusera leur connexion même si le Client ID est correct.

### Donner accès au Google Sheet lui-même

L'OAuth ci-dessus contrôle qui peut *se connecter au site*, mais l'accès aux données dépend séparément du **partage du fichier Google Sheets**. Sur le classeur (`E.B. Sàrl - Activité - Claude`), cliquer **Partager** et ajouter en modification :
- `jcomotti@gmail.com` (déjà propriétaire)
- `info@epicurious.ch`

## 2. Configurer le site

Ouvrir [assets/js/config.js](assets/js/config.js) et remplacer :

```js
export const GOOGLE_CLIENT_ID = "REMPLACER_PAR_VOTRE_CLIENT_ID.apps.googleusercontent.com";
```

par le Client ID obtenu à l'étape 1.

## 3. Publier sur GitHub (sans avoir besoin de `git` en local)

Le site est à la racine du projet (`index.html`, `assets/`) pour pouvoir utiliser la méthode la plus simple de GitHub Pages, **"Deploy from a branch"** — pas de workflow ni d'Actions à gérer.

1. Sur [github.com](https://github.com), créer un nouveau repository (vide, sans README).
2. Sur la page du repo vide, cliquer **"uploading an existing file"** et glisser-déposer tout le contenu de ce dossier (`index.html`, `assets/`, `docs/`, `README.md`) — tout part directement sur la branche `main`.
3. Mettre un message de commit et cliquer **"Commit changes"**.
4. Aller dans **Settings → Pages** du repo. Sous "Build and deployment" → **Source**, choisir **"Deploy from a branch"**. Sous "Branch", sélectionner **`main`** et le dossier **`/ (root)`** → **Save**.
5. Après une minute ou deux, l'URL du site apparaît en haut de cette même page Settings → Pages (`https://<votre-utilisateur>.github.io/<repo>/`).

⚠️ Si l'URL Pages diffère de ce qui a été saisi à l'étape 1, retourner dans Google Cloud Console pour l'ajouter aux origines autorisées (l'origine, c'est juste `https://<votre-utilisateur>.github.io`, sans le nom du repo derrière).

## 4. Utilisation

- Ouvrir le site, se connecter avec le compte Google **propriétaire du Google Sheet** (ou un compte à qui le Sheet a été partagé en modification).
- Naviguer entre les modules via la barre du haut.
- Dans **Clients → Fournisseurs**, cliquer "Initialiser depuis DB - Produits" une première fois pour créer la feuille `Fournisseurs` et la peupler avec les marques de `DB - Produits`, puis compléter les emails manuellement dans le Google Sheet ou via l'interface.

## Structure du projet

```
index.html                  → racine du repo = racine du site publié
assets/js/
  config.js                  → spreadsheet ID, colonnes des feuilles, Client ID OAuth
  auth.js                    → connexion Google (Identity Services)
  sheets-api.js               → lecture/ajout/maj génériques via l'API Sheets v4
  app.js                      → routeur (par hash) + navigation
  components/
    crud-table.js             → table + modale générique pour les feuilles éditables
    report-view.js             → tableau + graphique pour les feuilles de reporting
    modal.js
  modules/                     → un fichier par module de navigation
docs/shopify-feasibility.md   → note de faisabilité (pas d'implémentation dans cette phase)
```

## Limites connues de cette Phase 1

- Pas encore de connexion Shopify (voir [docs/shopify-feasibility.md](docs/shopify-feasibility.md)).
- Pas encore d'envoi de commandes fournisseurs par email, ni de feuille "Chiffre d'affaires" (Phase 3).
- Les modules Volumes, Inventaire viticole et Inventaire annuel sont en **lecture seule** : ce sont des feuilles d'agrégats calculées dans le Sheet lui-même, l'interface ne fait qu'en afficher le contenu.
- L'accès est protégé par le partage Google du fichier (pas de gestion de rôles/permissions dans l'app elle-même) — adapté à un usage interne mono-utilisateur.

## Tester en local

Les modules JS utilisent `import`/`export` (ES modules), qui nécessitent d'être servis en `http://`, pas ouverts directement en `file://`. Depuis la racine du projet :

```bash
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

Pensez à ajouter `http://localhost:8080` aux origines JavaScript autorisées dans Google Cloud Console pour tester en local.
