// Connexion Google (Identity Services) : on ne demande qu'un access token OAuth
// avec le scope Sheets, utilisé ensuite comme Bearer token pour l'API REST.
import { GOOGLE_CLIENT_ID, SHEETS_SCOPE } from "./config.js";

let tokenClient = null;
let accessToken = null;
let onChangeCallback = () => {};

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Impossible de charger Google Identity Services"));
    document.head.appendChild(script);
  });
}

export async function initAuth(onChange) {
  onChangeCallback = onChange || (() => {});
  await loadGisScript();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SHEETS_SCOPE,
    callback: (response) => {
      if (response.error) {
        onChangeCallback({ signedIn: false, error: response.error });
        return;
      }
      accessToken = response.access_token;
      onChangeCallback({ signedIn: true });
    },
  });
}

export function signIn() {
  tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
}

export function signOut() {
  if (accessToken) window.google.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = null;
  onChangeCallback({ signedIn: false });
}

export function getAccessToken() {
  return accessToken;
}

export function isSignedIn() {
  return !!accessToken;
}
