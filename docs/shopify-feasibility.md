# Faisabilité d'une connexion Shopify

Note de cadrage (pas d'implémentation dans cette phase).

## Ce qui est possible

Shopify expose une **Admin API** (REST ou GraphQL) qui permet, avec un token d'accès privé :
- Lire le catalogue produits/variantes et leurs stocks (`inventoryLevels`, `inventoryItems`).
- Lire les commandes (`orders`) pour du reporting de ventes en ligne.
- Écrire les niveaux de stock (`inventoryLevel.set` / `inventorySetQuantities` en GraphQL) pour synchroniser un stock géré ailleurs (ex. depuis les Achats/Ventes de cette interface) vers Shopify.

n8n propose un nœud Shopify natif (Trigger + Action), ce qui simplifie l'intégration si on choisit cette voie plus tard.

## Pourquoi pas maintenant, et pourquoi pas côté client

Le token Admin API Shopify est un secret : il ne doit **jamais** apparaître dans du code JavaScript exécuté dans le navigateur (contrairement à l'OAuth Google utilisé pour Sheets, qui repose sur le consentement de l'utilisateur). Toute intégration Shopify nécessite donc un intermédiaire qui détient ce secret côté serveur — c'est le rôle que jouera un workflow n8n/Make (webhook qui reçoit une requête de la SPA, appelle Shopify avec le token stocké dans ses credentials, renvoie le résultat).

## Scope recommandé pour une future Phase 2

1. Lecture seule d'abord (stock + commandes affichés dans l'app), zéro écriture vers Shopify — aucun risque de casser le site public en cas d'erreur.
2. Une fois validé, envisager une écriture ciblée (ex. décrémenter le stock Shopify après une vente enregistrée côté Achats/Ventes), avec confirmation manuelle avant chaque synchronisation.
