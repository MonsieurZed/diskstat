/**
 * @file js/treemap.js
 * @description Algorithme de layout squarified treemap et rendu récursif des nœuds.
 */

const DIR_HEADER_H = 16;
const DIR_HEADER_THIN_H = 4;
const MIN_RECT_PX = 4;

function squarify(children, rect) {
  if (!children || children.length === 0) return [];

  const totalSize = children.reduce((s, c) => s + c.size, 0);
  if (totalSize === 0) return [];

  const rects = [];
  let remaining = [...children];
  let { x, y, w, h } = rect;

  while (remaining.length > 0) {
    const isWide = w >= h;
    const side = isWide ? h : w;
    const totalRemaining = remaining.reduce((s, c) => s + c.size, 0);

    let row = [remaining[0]];
    let rowSize = remaining[0].size;

    for (let i = 1; i < remaining.length; i++) {
      const testRow = [...row, remaining[i]];
      const testSize = rowSize + remaining[i].size;
      const rowLength = (testSize / totalRemaining) * (isWide ? w : h);

      let worstRatio = 0;
      for (const item of testRow) {
        const itemSide = (item.size / testSize) * side;
        const ratio = Math.max(rowLength / itemSide, itemSide / rowLength);
        worstRatio = Math.max(worstRatio, ratio);
      }

      let currentWorst = 0;
      const currentLength = (rowSize / totalRemaining) * (isWide ? w : h);
      for (const item of row) {
        const itemSide = (item.size / rowSize) * side;
        const ratio = Math.max(currentLength / itemSide, itemSide / currentLength);
        currentWorst = Math.max(currentWorst, ratio);
      }

      if (worstRatio <= currentWorst) {
        row = testRow;
        rowSize = testSize;
      } else {
        break;
      }
    }

    const rowLength = (rowSize / totalRemaining) * (isWide ? w : h);
    let offset = 0;

    for (const item of row) {
      const itemSize = (item.size / rowSize) * side;
      const r = { node: item };
      if (isWide) {
        r.x = x;
        r.y = y + offset;
        r.w = rowLength;
        r.h = itemSize;
      } else {
        r.x = x + offset;
        r.y = y;
        r.w = itemSize;
        r.h = rowLength;
      }
      rects.push(r);
      offset += itemSize;
    }

    if (isWide) {
      x += rowLength;
      w -= rowLength;
    } else {
      y += rowLength;
      h -= rowLength;
    }

    remaining = remaining.slice(row.length);
  }

  return rects;
}

function renderTreemap(data) {
  const container = document.getElementById("treemap");
  container.querySelectorAll(".treemap-node").forEach((n) => n.remove());

  const rect = container.getBoundingClientRect();
  const usedExtensions = new Set();

  function renderNode(parentEl, node, x, y, w, h, depth, ancestors) {
    if (w < MIN_RECT_PX || h < MIN_RECT_PX) return;

    const isDir = node.children && node.children.length > 0;

    if (!isDir) {
      const ext = (node.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
      if (ext) usedExtensions.add(ext);
      const color = getColor(node, depth);
      const div = document.createElement("div");
      div.className = "treemap-node treemap-node-file";
      div.style.left = x + "px";
      div.style.top = y + "px";
      div.style.width = Math.max(w - 1, 0) + "px";
      div.style.height = Math.max(h - 1, 0) + "px";
      div.style.background = color;

      if (!hideLabels && w > 40 && h > 16) {
        const label = document.createElement("div");
        label.className = "treemap-label";
        label.textContent = node.name;
        div.appendChild(label);
      }
      if (!hideLabels && w > 50 && h > 30) {
        const sizeLabel = document.createElement("div");
        sizeLabel.className = "treemap-size";
        sizeLabel.textContent = formatSize(node.size);
        div.appendChild(sizeLabel);
      }

      div.addEventListener("click", (e) => {
        e.stopPropagation();
        hideContextMenu();
        const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
        if (parent && parent !== data) navigateToNode(parent);
      });

      attachTooltip(div, node, data, ancestors);
      attachContextMenu(div, node);
      parentEl.appendChild(div);
      return;
    }

    const color = DIR_COLORS[depth % DIR_COLORS.length];
    const div = document.createElement("div");
    div.className = "treemap-node treemap-node-dir";
    div.style.left = x + "px";
    div.style.top = y + "px";
    div.style.width = Math.max(w - 1, 0) + "px";
    div.style.height = Math.max(h - 1, 0) + "px";
    div.style.background = color;

    const showFullHeader = !hideLabels && depth <= 1 && w > 30 && h > DIR_HEADER_H + MIN_RECT_PX;
    const showThinHeader = !hideLabels && !showFullHeader && h > DIR_HEADER_THIN_H + MIN_RECT_PX;
    const headerH = showFullHeader ? DIR_HEADER_H : showThinHeader ? DIR_HEADER_THIN_H : 0;

    if (showFullHeader) {
      const header = document.createElement("div");
      header.className = "treemap-dir-header";
      header.textContent = node.name;
      header.style.background = color;
      div.appendChild(header);
    } else if (showThinHeader) {
      const header = document.createElement("div");
      header.className = "treemap-dir-header";
      header.style.height = DIR_HEADER_THIN_H + "px";
      header.style.minHeight = DIR_HEADER_THIN_H + "px";
      header.style.background = color;
      header.style.cursor = "pointer";
      div.appendChild(header);
    }

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      hideContextMenu();
      navigateToNode(node);
    });

    attachTooltip(div, node, data, ancestors);
    attachContextMenu(div, node);
    parentEl.appendChild(div);

    const innerX = 1;
    const innerY = headerH;
    const innerW = Math.max(w - 3, 0);
    const innerH = Math.max(h - headerH - 2, 0);

    if (innerW > MIN_RECT_PX && innerH > MIN_RECT_PX && node.children.length > 0) {
      const childRects = squarify(node.children, { x: innerX, y: innerY, w: innerW, h: innerH });
      for (const cr of childRects) {
        renderNode(div, cr.node, cr.x, cr.y, cr.w, cr.h, depth + 1, [...ancestors, node]);
      }
    }
  }

  const rects = squarify(data.children || [], { x: 0, y: 0, w: rect.width, h: rect.height });
  for (const r of rects) {
    renderNode(container, r.node, r.x, r.y, r.w, r.h, 0, [data]);
  }

  renderExtLegend(usedExtensions);
}

function attachTooltip(div, node, rootData, ancestors) {
  div.addEventListener("mouseenter", (e) => {
    e.stopPropagation();
    const isDir = node.children && node.children.length > 0;
    const scanRoot = navStack.length > 0 ? navStack[0] : rootData;
    const pctView = rootData.size > 0 ? ((node.size / rootData.size) * 100).toFixed(2) : "0.00";
    const pctTotal = scanRoot.size > 0 ? ((node.size / scanRoot.size) * 100).toFixed(2) : "0.00";

    const arrLine = node.arr ? `<div class="tt-arr">${node.arr.service === "radarr" ? "&#127916;" : "&#128250;"} ${node.arr.title}</div>` : "";
    const watchLabel = node.watchCount > 0 ? `<div class="tt-watch">&#128065; ${node.watchCount} ${node.watchCount !== 1 ? t("viewsPlural") : t("views")}</div>` : "";

    const visibleAncestors = (ancestors || []).filter((a) => a !== rootData);
    const ancestorLines = visibleAncestors.map((a) => `<div class="tt-ancestor">&#128193; ${a.name} &mdash; ${formatSize(a.size)}</div>`).join("");

    tooltip.innerHTML = `
      <div class="tt-path">${node.path}</div>
      <div class="tt-size">${formatSize(node.size)}</div>
      <div class="tt-pct">${pctView}% ${t("ofCurrentView")}${isDir ? " | " + t("clickToEnter") : ""}</div>
      <div class="tt-pct">${pctTotal}% ${t("ofTotal")}</div>
      ${ancestorLines}${arrLine}${watchLabel}
    `;
    tooltip.style.display = "block";
  });
  div.addEventListener("mousemove", (e) => {
    const tw = tooltip.offsetWidth || 200;
    const th = tooltip.offsetHeight || 80;
    const tx = e.clientX + 12 + tw > window.innerWidth ? e.clientX - tw - 8 : e.clientX + 12;
    const ty = e.clientY + 12 + th > window.innerHeight ? e.clientY - th - 8 : e.clientY + 12;
    tooltip.style.left = tx + "px";
    tooltip.style.top = ty + "px";
  });
  div.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
}
