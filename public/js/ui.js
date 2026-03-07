/**
 * @file js/ui.js
 * @description Mise à jour de la barre de statut, rendu global et mise à jour
 *              en mémoire de l'arbre après une suppression ou un déplacement.
 */

/**
 * Compte récursivement les fichiers, dossiers et éléments Arr dans un arbre.
 * @param {Object} node - Nœud racine à parcourir.
 * @returns {{files: number, dirs: number, arrCount: number}} Compteurs.
 */
function countTreeStats(node) {
  let files = 0, dirs = 0, arrCount = 0;
  if (!node.children || node.children.length === 0) {
    return { files: 1, dirs: 0, arrCount: node.arr ? 1 : 0 };
  }
  dirs++;
  if (node.arr) arrCount++;
  for (const child of node.children) {
    const sub = countTreeStats(child);
    files    += sub.files;
    dirs     += sub.dirs;
    arrCount += sub.arrCount;
  }
  return { files, dirs, arrCount };
}

function updateStatus(data) {
  const totalSize = formatSize(data.size);
  const stats     = countTreeStats(data);
  const scanTime  = lastScanDuration ? `${(lastScanDuration / 1000).toFixed(1)}s` : '';

  document.getElementById('statusLeft').textContent = `${data.path} - ${totalSize}`;
  document.getElementById('statusRight').textContent =
    `${stats.files} ${t('files')} | ${stats.dirs} ${t('folders')}` +
    (stats.arrCount > 0 ? ` | ${stats.arrCount} ${t('media')}` : '') +
    (scanTime ? ` | ${scanTime}` : '');
}

function renderAll(data) {
  renderTreemap(data);
  renderFileList(data);
  renderBreadcrumb(data);
  updateStatus(data);
}

/**
 * Recherche le chemin d'ancêtres depuis root jusqu'à target.
 * @param {Object} root   - Nœud racine de recherche.
 * @param {Object} target - Nœud cible.
 * @returns {Array|null} Tableau [root, ..., target] ou null si non trouvé.
 */
function findAncestors(root, target) {
  if (root === target) return [root];
  if (!root.children) return null;
  for (const child of root.children) {
    const chain = findAncestors(child, target);
    if (chain) return [root, ...chain];
  }
  return null;
}

/**
 * Navigue vers un nœud en reconstruisant le navStack complet.
 * @param {Object} node - Nœud cible de la navigation.
 */
function navigateToNode(node) {
  if (node === currentData) return;
  const ancestors = findAncestors(currentData, node);
  if (ancestors && ancestors.length > 1) {
    for (let i = 0; i < ancestors.length - 1; i++) {
      navStack.push(ancestors[i]);
    }
  } else {
    navStack.push(currentData);
  }
  currentData = node;
  renderAll(node);
}

function patchTreeRemove(targetPath) {
  const root = navStack.length > 0 ? navStack[0] : currentData;
  if (!root) return false;

  function remove(node) {
    if (!node.children) return 0;
    const idx = node.children.findIndex(c => c.path === targetPath);
    if (idx !== -1) {
      const sz = node.children[idx].size;
      node.children.splice(idx, 1);
      node.size = Math.max(0, node.size - sz);
      node.children.sort((a, b) => b.size - a.size);
      return sz;
    }
    for (const child of node.children) {
      const sz = remove(child);
      if (sz) {
        node.size = Math.max(0, node.size - sz);
        node.children.sort((a, b) => b.size - a.size);
        return sz;
      }
    }
    return 0;
  }

  if (!remove(root)) return false;

  const chain  = [...navStack, currentData];
  const cutIdx = chain.findIndex(n => n.path === targetPath || n.path.startsWith(targetPath + '/'));
  if (cutIdx !== -1) {
    navStack    = chain.slice(0, Math.max(0, cutIdx - 1));
    currentData = cutIdx > 0 ? chain[cutIdx - 1] : root;
  }

  renderAll(currentData);
  return true;
}
