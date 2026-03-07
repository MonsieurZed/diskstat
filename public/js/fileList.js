/**
 * @file js/fileList.js
 * @description Rendu de la liste latérale de fichiers, du fil d'Ariane et de la légende.
 */

function renderFileList(data) {
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  if (!data.children) return;

  const scanRoot = navStack.length > 0 ? navStack[0] : data;

  data.children.forEach(child => {
    const isDir    = child.children && child.children.length > 0;
    const pct      = data.size > 0 ? (child.size / data.size * 100) : 0;
    const pctView  = data.size > 0 ? (child.size / data.size * 100).toFixed(2) : '0.00';
    const pctTotal = scanRoot.size > 0 ? (child.size / scanRoot.size * 100).toFixed(2) : '0.00';
    const color    = getColor(child, navStack.length);

    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span class="icon">${isDir ? '&#128193;' : '&#128196;'}</span>
      <span class="name" title="${child.name}">${child.name}</span>
      <span class="size">${formatSize(child.size)}</span>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="pct-stack">
        <span class="pct-view">${pctView}% vue</span>
        <span class="pct-total">${pctTotal}% total</span>
      </div>
    `;

    item.addEventListener('click', () => {
      if (isDir) {
        navigateToNode(child);
      }
    });

    item.addEventListener('mouseenter', () => { item.classList.add('active'); });
    item.addEventListener('mouseleave', () => { item.classList.remove('active'); });

    attachContextMenu(item, child);
    list.appendChild(item);
  });
}

function renderBreadcrumb(data) {
  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = '';

  const parts = [];
  for (let i = 0; i < navStack.length; i++) {
    parts.push({ name: navStack[i].name || navStack[i].path, idx: i });
  }
  parts.push({ name: data.name || data.path, idx: -1 });

  parts.forEach((p, i) => {
    const span = document.createElement('span');
    span.textContent = p.name;
    if (p.idx >= 0) {
      span.addEventListener('click', () => {
        const target = navStack[p.idx];
        navStack     = navStack.slice(0, p.idx);
        currentData  = target;
        renderAll(target);
      });
    }
    bc.appendChild(span);
    if (i < parts.length - 1) {
      const sep       = document.createElement('span');
      sep.className   = 'sep';
      sep.textContent = '>';
      bc.appendChild(sep);
    }
  });
}

function renderExtLegend(extensions) {
  const legend  = document.getElementById('extLegend');
  legend.innerHTML = '';

  const sorted = [...extensions].sort();
  sorted.forEach(ext => {
    const color = EXT_COLORS[ext] || '#565f89';
    const item  = document.createElement('div');
    item.className = 'ext-legend-item';
    item.innerHTML = `<div class="ext-legend-color" style="background:${color}"></div><span>${ext}</span>`;
    legend.appendChild(item);
  });

  const dirItem = document.createElement('div');
  dirItem.className = 'ext-legend-item';
  dirItem.innerHTML = `<div class="ext-legend-color" style="background:${DIR_COLORS[0]}"></div><span>directories</span>`;
  legend.prepend(dirItem);
}
