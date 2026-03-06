/**
 * @file js/history.js
 * @description Gestion de l'historique des scans en localStorage :
 *              sauvegarde, chargement, suppression et rendu de la liste.
 */

const HISTORY_KEY = 'dirstat_scan_history';
const MAX_HISTORY = 10;

function getScanHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function saveScanToHistory(scanPath, depth, data) {
  const history  = getScanHistory();
  const filtered = history.filter(h => !(h.path === scanPath && h.depth === depth));
  filtered.unshift({
    path:  scanPath,
    depth: parseInt(depth),
    size:  data.size,
    date:  new Date().toISOString(),
    data,
  });
  const trimmed = filtered.slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    trimmed.pop();
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch {}
  }
  renderHistory();
}

function loadFromHistory(entry) {
  currentData = entry.data;
  navStack    = [];
  document.getElementById('pathInput').value   = entry.path;
  document.getElementById('depthSelect').value = entry.depth;
  renderAll(entry.data);
}

function deleteFromHistory(idx) {
  const history = getScanHistory();
  history.splice(idx, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const history = getScanHistory();
  list.innerHTML = '';

  if (history.length === 0) {
    list.innerHTML = '<div style="padding:14px;color:var(--fg2);font-size:12px;text-align:center;">No scans yet.<br>Enter a path and click Scan.</div>';
    return;
  }

  history.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const age = getRelativeTime(entry.date);
    item.innerHTML = `
      <div class="history-main">
        <span class="history-path" title="${entry.path}">${entry.path}</span>
        <span class="history-meta">${formatSize(entry.size)} &middot; d${entry.depth} &middot; ${age}</span>
      </div>
      <button class="history-del" title="Remove">&times;</button>
    `;
    item.querySelector('.history-main').addEventListener('click', () => loadFromHistory(entry));
    item.querySelector('.history-del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteFromHistory(idx);
    });
    list.appendChild(item);
  });
}

function getRelativeTime(isoDate) {
  const diff  = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days  = Math.floor(hours / 24);
  return days + 'd ago';
}
