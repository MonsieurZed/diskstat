/**
 * @file js/fileOps.js
 * @description Menu contextuel, modales et opérations sur les fichiers :
 *              copie de chemin, suppression, déplacement et informations.
 */

let ctxTarget = null;

function attachContextMenu(el, node) {
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    ctxTarget = node;

    const arrSep  = document.getElementById('ctxArrSep');
    const arrItem = document.getElementById('ctxArr');
    arrSep.style.display  = 'none';
    arrItem.style.display = 'none';

    if (node.arr) {
      const arrIcon  = document.getElementById('ctxArrIcon');
      const arrLabel = document.getElementById('ctxArrLabel');
      const isRadarr = node.arr.service === 'radarr';
      arrIcon.innerHTML    = isRadarr ? '&#127916;' : '&#128250;';
      arrLabel.textContent = isRadarr ? 'Ouvrir dans Radarr' : 'Ouvrir dans Sonarr';
      arrSep.style.display  = '';
      arrItem.style.display = '';
    }

    const menu = document.getElementById('ctxMenu');
    menu.style.display = 'block';
    const mw = menu.offsetWidth || 180;
    const mh = menu.offsetHeight || 160;
    const mx = (e.clientX + mw > window.innerWidth)  ? e.clientX - mw : e.clientX;
    const my = (e.clientY + mh > window.innerHeight) ? e.clientY - mh : e.clientY;
    menu.style.left = mx + 'px';
    menu.style.top  = my + 'px';
  });
}

function hideContextMenu() {
  document.getElementById('ctxMenu').style.display = 'none';
  ctxTarget = null;
}

function copyToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    if (el) {
      const orig = el.textContent;
      el.textContent = 'Copied!';
      setTimeout(() => { el.textContent = orig; }, 1000);
    }
  });
}

document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('.ctx-menu')) hideContextMenu();
});

document.getElementById('ctxCopy').addEventListener('click', () => {
  if (!ctxTarget) return;
  copyToClipboard(ctxTarget.path);
  hideContextMenu();
});

document.getElementById('ctxDelete').addEventListener('click', () => {
  if (!ctxTarget) return;
  const nodePath = ctxTarget.path;
  hideContextMenu();
  openDeleteModal(nodePath);
});

document.getElementById('ctxMove').addEventListener('click', () => {
  if (!ctxTarget) return;
  const nodePath = ctxTarget.path;
  hideContextMenu();
  openMoveModal(nodePath);
});

document.getElementById('ctxInfo').addEventListener('click', () => {
  if (!ctxTarget) return;
  const nodePath = ctxTarget.path;
  hideContextMenu();
  openInfoModal(nodePath);
});

document.getElementById('ctxArr').addEventListener('click', () => {
  if (!ctxTarget || !ctxTarget.arr || !ctxTarget.arr.url) return;
  window.open(ctxTarget.arr.url, '_blank');
  hideContextMenu();
});

/* ─── Modal helpers ─── */

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function openModal(id)  { document.getElementById(id).classList.add('active'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

document.addEventListener('click', (e) => {
  const pathEl = e.target.closest('.modal-path');
  if (pathEl) copyToClipboard(pathEl.textContent, pathEl);
});

/* ─── Delete modal ─── */

let deleteTargetPath = null;

function openDeleteModal(filePath) {
  deleteTargetPath = filePath;
  document.getElementById('deleteTargetPath').textContent = filePath;
  openModal('deleteModal');
}

document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
  if (!deleteTargetPath) return;
  const btn = document.getElementById('deleteConfirmBtn');
  btn.disabled   = true;
  btn.textContent = 'Deleting...';
  try {
    const resp   = await fetch('/api/delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ path: deleteTargetPath }),
    });
    const result = await resp.json();
    if (result.error) {
      alert('Delete failed: ' + result.error);
    } else {
      closeModal('deleteModal');
      if (!patchTreeRemove(deleteTargetPath)) startScan();
    }
  } catch (err) {
    alert('Delete failed: ' + err.message);
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Delete';
  }
});

/* ─── Info modal ─── */

async function openInfoModal(filePath) {
  const body = document.getElementById('infoModalBody');
  body.innerHTML = '<div style="text-align:center;color:var(--fg2)">Loading...</div>';
  openModal('infoModal');

  try {
    const resp = await fetch(`/api/info?path=${encodeURIComponent(filePath)}`);
    const info = await resp.json();
    if (info.error) { body.innerHTML = `<div style="color:var(--red)">${info.error}</div>`; return; }

    const type  = info.isDir ? 'Directory' : info.isSymlink ? 'Symlink' : 'File';
    const mtime = new Date(info.mtime).toLocaleString();
    const ctime = new Date(info.ctime).toLocaleString();
    const btime = new Date(info.birthtime).toLocaleString();

    body.innerHTML = `
      <div class="info-grid">
        <span class="info-label">Path</span><span class="info-value" style="cursor:pointer;color:var(--accent)" onclick="copyToClipboard('${info.path}', this)" title="Click to copy">${info.path}</span>
        <span class="info-label">Name</span><span class="info-value">${info.name}</span>
        <span class="info-label">Type</span><span class="info-value">${type}</span>
        <span class="info-label">Size</span><span class="info-value">${formatSize(info.size)} (${info.size.toLocaleString()} bytes)</span>
        <span class="info-label">Permissions</span><span class="info-value">${info.mode}</span>
        <span class="info-label">Owner</span><span class="info-value">uid:${info.uid} gid:${info.gid}</span>
        <span class="info-label">Modified</span><span class="info-value">${mtime}</span>
        <span class="info-label">Changed</span><span class="info-value">${ctime}</span>
        <span class="info-label">Created</span><span class="info-value">${btime}</span>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="color:var(--red)">Error: ${err.message}</div>`;
  }
}

/* ─── Move modal ─── */

let moveSourcePath  = null;
let moveCurrentDir  = '/';

function openMoveModal(filePath) {
  moveSourcePath = filePath;
  document.getElementById('moveSourcePath').textContent = filePath;
  const parentDir = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
  moveCurrentDir  = parentDir;
  openModal('moveModal');
  loadMoveDir(parentDir);
}

async function loadMoveDir(dirPath) {
  moveCurrentDir = dirPath;
  const list = document.getElementById('moveList');
  const bc   = document.getElementById('moveBreadcrumb');

  list.innerHTML = '<div style="padding:12px;color:var(--fg2);text-align:center">Loading...</div>';
  bc.innerHTML   = '';

  const parts = dirPath === '/' ? ['/'] : dirPath.split('/').filter(Boolean);
  const rootSpan = document.createElement('span');
  rootSpan.textContent = '/';
  rootSpan.addEventListener('click', () => loadMoveDir('/'));
  bc.appendChild(rootSpan);

  let accumulated = '';
  for (const part of parts) {
    if (dirPath === '/' && part === '/') continue;
    accumulated += '/' + part;
    const sepEl       = document.createElement('span');
    sepEl.className   = 'sep';
    sepEl.textContent = '>';
    bc.appendChild(sepEl);
    const partSpan       = document.createElement('span');
    partSpan.textContent = part;
    const partPath       = accumulated;
    partSpan.addEventListener('click', () => loadMoveDir(partPath));
    bc.appendChild(partSpan);
  }

  try {
    const resp  = await fetch(`/api/list?path=${encodeURIComponent(dirPath)}`);
    const items = await resp.json();
    if (items.error) { list.innerHTML = `<div style="padding:12px;color:var(--red)">${items.error}</div>`; return; }

    list.innerHTML = '';
    const dirs = items.filter(i => i.isDir).sort((a, b) => a.name.localeCompare(b.name));

    if (dirs.length === 0) {
      list.innerHTML = '<div style="padding:12px;color:var(--fg2);text-align:center">No subdirectories</div>';
      return;
    }

    for (const dir of dirs) {
      const item       = document.createElement('div');
      item.className   = 'move-item';
      item.innerHTML   = `<span class="mi-icon">&#128193;</span><span class="mi-name">${dir.name}</span>`;
      item.addEventListener('click', () => loadMoveDir(dir.path));
      list.appendChild(item);
    }
  } catch (err) {
    list.innerHTML = `<div style="padding:12px;color:var(--red)">Error: ${err.message}</div>`;
  }
}

document.getElementById('moveConfirmBtn').addEventListener('click', async () => {
  if (!moveSourcePath || !moveCurrentDir) return;
  const btn = document.getElementById('moveConfirmBtn');
  btn.disabled   = true;
  btn.textContent = 'Moving...';
  try {
    const resp   = await fetch('/api/move', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ source: moveSourcePath, destination: moveCurrentDir }),
    });
    const result = await resp.json();
    if (result.error) {
      alert('Move failed: ' + result.error);
    } else {
      closeModal('moveModal');
      if (!patchTreeRemove(moveSourcePath)) startScan();
    }
  } catch (err) {
    alert('Move failed: ' + err.message);
  } finally {
    btn.disabled   = false;
    btn.textContent = 'Move here';
  }
});
