/**
 * @file js/events.js
 * @description Gestionnaires d'événements globaux : clavier, redimensionnement
 *              et initialisation au chargement de la page.
 */

document.addEventListener('keydown', (e) => {
  if (document.querySelector('.modal-overlay.active')) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      hideContextMenu();
    }
    return;
  }
  if (e.target.tagName === 'INPUT') {
    if (e.key === 'Enter' && e.target === document.getElementById('pathInput')) {
      startScan();
    }
    return;
  }
  if (e.key === 'Backspace' || e.key === 'Escape') {
    if (navStack.length > 0) {
      currentData = navStack.pop();
      renderAll(currentData);
    }
  }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentData) renderTreemap(currentData);
  }, 150);
});

window.addEventListener('load', () => {
  renderHistory();

  const saved = sessionStorage.getItem('dirstat_active_scan');
  if (saved) {
    try {
      const savedScan = JSON.parse(saved);
      reconnectToScan(savedScan);
    } catch {
      sessionStorage.removeItem('dirstat_active_scan');
    }
  }
});
