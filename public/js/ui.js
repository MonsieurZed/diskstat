/**
 * @file js/ui.js
 * @description Mise à jour de la barre de statut, rendu global et mise à jour
 *              en mémoire de l'arbre après une suppression ou un déplacement.
 */

function updateStatus(data) {
  const totalSize  = formatSize(data.size);
  const childCount = data.children ? data.children.length : 0;
  document.getElementById('statusLeft').textContent  = `${data.path} - ${totalSize} total`;
  document.getElementById('statusRight').textContent = `${childCount} items`;
}

function renderAll(data) {
  renderTreemap(data);
  renderFileList(data);
  renderBreadcrumb(data);
  updateStatus(data);
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
