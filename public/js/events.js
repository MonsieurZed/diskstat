/**
 * @file js/events.js
 * @description Gestionnaires d'événements globaux : clavier, redimensionnement
 *              et initialisation au chargement de la page.
 */

document.addEventListener("keydown", (e) => {
  if (document.querySelector(".modal-overlay.active")) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.active").forEach((m) => m.classList.remove("active"));
      hideContextMenu();
    }
    return;
  }
  if (e.target.tagName === "INPUT") {
    if (e.key === "Enter" && e.target === document.getElementById("pathInput")) {
      startScan();
    }
    return;
  }
  if (e.key === "Backspace" || e.key === "Escape") {
    if (navStack.length > 0) {
      currentData = navStack.pop();
      renderAll(currentData);
    }
  }
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentData) renderTreemap(currentData);
  }, 150);
});

window.addEventListener("load", () => {
  const hideHiddenToggle = document.getElementById("hideHiddenToggle");
  const hideLabelsToggle = document.getElementById("hideLabelsToggle");

  const savedHideHidden = localStorage.getItem("explorerr_hide_hidden");
  if (savedHideHidden !== null) {
    hideHiddenToggle.checked = savedHideHidden === "1";
  }

  const savedHideLabels = localStorage.getItem("explorerr_hide_labels");
  if (savedHideLabels !== null) {
    hideLabelsToggle.checked = savedHideLabels === "1";
    hideLabels = hideLabelsToggle.checked;
  }

  hideHiddenToggle.addEventListener("change", (e) => {
    localStorage.setItem("explorerr_hide_hidden", e.target.checked ? "1" : "0");
  });

  hideLabelsToggle.addEventListener("change", (e) => {
    hideLabels = e.target.checked;
    localStorage.setItem("explorerr_hide_labels", e.target.checked ? "1" : "0");
    if (currentData) renderTreemap(currentData);
  });

  const lastPath = localStorage.getItem("explorerr_last_path");
  if (lastPath) {
    document.getElementById("pathInput").value = lastPath;
  }

  const depthSelect = document.getElementById("depthSelect");
  const savedDepth = localStorage.getItem("explorerr_depth");
  if (savedDepth) depthSelect.value = savedDepth;
  depthSelect.addEventListener("change", (e) => {
    localStorage.setItem("explorerr_depth", e.target.value);
  });

  const saved = sessionStorage.getItem("explorerr_active_scan");
  if (saved) {
    try {
      const savedScan = JSON.parse(saved);
      reconnectToScan(savedScan);
    } catch {
      sessionStorage.removeItem("explorerr_active_scan");
    }
  }
});
