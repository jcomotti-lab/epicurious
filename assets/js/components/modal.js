// Petit gestionnaire de modale générique, réutilisé par tous les modules.
const overlay = document.getElementById("modal-overlay");
const modalBody = document.getElementById("modal-body");

export function openModal(html) {
  modalBody.innerHTML = html;
  overlay.classList.remove("hidden");
}

export function closeModal() {
  overlay.classList.add("hidden");
  modalBody.innerHTML = "";
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
