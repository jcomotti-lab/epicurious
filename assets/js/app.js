import { initAuth, signIn, signOut, isSignedIn } from "./auth.js";

const ROUTES = [
  { hash: "accueil", label: "Accueil" },
  { hash: "produits", label: "Produits" },
  { hash: "clients", label: "Clients" },
  { hash: "volumes", label: "Volumes" },
  { hash: "inventaire-viticole", label: "Inventaire viticole" },
  { hash: "achats", label: "Achats" },
  { hash: "ventes", label: "Ventes" },
  { hash: "inventaire-annuel", label: "Inventaire annuel" },
  { hash: "facture", label: "Facture" },
];

const nav = document.getElementById("main-nav");
const content = document.getElementById("app-content");
const gate = document.getElementById("auth-gate");
const btnSignIn = document.getElementById("btn-sign-in");
const btnSignOut = document.getElementById("btn-sign-out");

nav.innerHTML = ROUTES.map((r) => `<a href="#${r.hash}" data-hash="${r.hash}">${r.label}</a>`).join("");

async function loadModule(hash) {
  const mod = await import(`./modules/${hash}.js`);
  content.innerHTML = "";
  mod.render(content);
}

function currentHash() {
  return (location.hash || "#accueil").slice(1);
}

function updateActiveNav() {
  const hash = currentHash();
  nav.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.hash === hash));
}

async function route() {
  if (!isSignedIn()) return;
  updateActiveNav();
  try {
    await loadModule(currentHash());
  } catch (err) {
    content.innerHTML = `<p class="error">Erreur de chargement du module : ${err.message}</p>`;
  }
}

window.addEventListener("hashchange", route);

btnSignIn.addEventListener("click", () => signIn());
btnSignOut.addEventListener("click", () => {
  signOut();
  gate.classList.remove("hidden");
  nav.classList.add("hidden");
  content.innerHTML = "";
});

initAuth(({ signedIn }) => {
  if (signedIn) {
    gate.classList.add("hidden");
    nav.classList.remove("hidden");
    route();
  } else {
    gate.classList.remove("hidden");
    nav.classList.add("hidden");
  }
});
