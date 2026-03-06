/**
 * @file scanner.js
 * @description Logique de scan récursif du système de fichiers.
 *              Contient la fonction de scan synchrone et le point d'entrée
 *              du thread Worker (exécution hors thread principal).
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync }                      = require('child_process');
const { isMainThread, parentPort, workerData } = require('worker_threads');

const { MAX_DEPTH, MIN_SIZE, SKIP_PATHS } = require('./config');
const { toRealPath, toDisplayPath }       = require('./paths');

/**
 * Dernier horodatage d'envoi de progression (throttle 200 ms).
 * @type {number}
 */
let scanLastPost = 0;

/**
 * Indique si les fichiers cachés (.nom) doivent être ignorés.
 * @type {boolean}
 */
let hideHiddenFlag = false;

/**
 * Scanne récursivement un répertoire et retourne son arbre de taille.
 * @param {string} dirPath  - Chemin absolu du répertoire à scanner.
 * @param {number} depth    - Profondeur courante (commence à 0).
 * @param {number} maxDepth - Profondeur maximale autorisée.
 * @returns {{ name: string, path: string, size: number, children: Array }}
 */
function scanDirSync(dirPath, depth, maxDepth) {
  const result = {
    name: path.basename(dirPath) || '/',
    path: toDisplayPath(dirPath),
    children: [],
    size: 0,
  };

  if (depth >= maxDepth) {
    try {
      const output = execSync(`du -sb "${dirPath}" 2>/dev/null`, { timeout: 300000 }).toString().trim();
      result.size = parseInt(output.split('\t')[0]) || 0;
    } catch { result.size = 0; }
    return result;
  }

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch { return result; }

  for (const entry of entries) {
    const fullPath    = path.join(dirPath, entry.name);
    const displayFull = toDisplayPath(fullPath);

    if (depth === 0 && SKIP_PATHS.includes(displayFull)) continue;
    if (hideHiddenFlag && entry.name.startsWith('.')) continue;

    try {
      const stat = fs.lstatSync(fullPath);
      if (stat.isSymbolicLink()) continue;

      if (stat.isDirectory()) {
        if (!isMainThread) {
          const now = Date.now();
          if (now - scanLastPost > 200) {
            scanLastPost = now;
            parentPort.postMessage({ type: 'progress', currentPath: displayFull });
          }
        }
        const child = scanDirSync(fullPath, depth + 1, maxDepth);
        result.size += child.size;
        if (child.size >= MIN_SIZE) {
          result.children.push(child);
        }
      } else if (stat.isFile()) {
        result.size += stat.size;
        if (stat.size >= MIN_SIZE) {
          result.children.push({ name: entry.name, path: displayFull, size: stat.size, children: [] });
        }
      }
    } catch { /* skip */ }
  }

  result.children.sort((a, b) => b.size - a.size);
  if (result.children.length > 200) {
    const kept      = result.children.slice(0, 200);
    const otherSize = result.children.slice(200).reduce((s, c) => s + c.size, 0);
    kept.push({ name: `(${result.children.length - 200} others)`, path: '', size: otherSize, children: [] });
    result.children = kept;
  }
  return result;
}

/**
 * Point d'entrée du thread Worker.
 * Scanne le chemin transmis via workerData et poste les messages de progression
 * puis le résultat final via parentPort.
 */
if (!isMainThread) {
  const { scanPath, maxDepth, hideHidden } = workerData;
  hideHiddenFlag = !!hideHidden;

  const rootResult = {
    name: path.basename(scanPath) || '/',
    path: toDisplayPath(scanPath),
    children: [],
    size: 0,
  };

  let entries;
  try {
    entries = fs.readdirSync(scanPath, { withFileTypes: true });
  } catch {
    parentPort.postMessage({ type: 'done', data: rootResult });
    process.exit(0);
  }

  const topDirs  = [];
  const topFiles = [];

  for (const entry of entries) {
    const fullPath    = path.join(scanPath, entry.name);
    const displayFull = toDisplayPath(fullPath);
    if (SKIP_PATHS.includes(displayFull)) continue;
    if (hideHiddenFlag && entry.name.startsWith('.')) continue;
    try {
      const s = fs.lstatSync(fullPath);
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) topDirs.push(entry);
      else if (s.isFile()) topFiles.push({ entry, stat: s });
    } catch {}
  }

  const totalTopDirs = topDirs.length;

  for (const { entry, stat } of topFiles) {
    rootResult.size += stat.size;
    if (stat.size >= MIN_SIZE) {
      rootResult.children.push({
        name: entry.name,
        path: toDisplayPath(path.join(scanPath, entry.name)),
        size: stat.size,
        children: [],
      });
    }
  }

  for (let i = 0; i < topDirs.length; i++) {
    const entry    = topDirs[i];
    const fullPath = path.join(scanPath, entry.name);
    const pct      = totalTopDirs > 0 ? Math.min(99, Math.round((i / totalTopDirs) * 100)) : 0;

    parentPort.postMessage({
      type: 'progress',
      currentPath: toDisplayPath(fullPath),
      pct,
      topLevelDone:  i,
      topLevelTotal: totalTopDirs,
    });

    scanLastPost  = Date.now();
    const child   = scanDirSync(fullPath, 1, maxDepth);
    rootResult.size += child.size;
    if (child.size >= MIN_SIZE) {
      rootResult.children.push(child);
    }
  }

  rootResult.children.sort((a, b) => b.size - a.size);
  if (rootResult.children.length > 200) {
    const kept      = rootResult.children.slice(0, 200);
    const otherSize = rootResult.children.slice(200).reduce((s, c) => s + c.size, 0);
    kept.push({ name: `(${rootResult.children.length - 200} others)`, path: '', size: otherSize, children: [] });
    rootResult.children = kept;
  }

  parentPort.postMessage({ type: 'progress', currentPath: toDisplayPath(scanPath), pct: 100 });
  parentPort.postMessage({ type: 'done', data: rootResult });
  process.exit(0);
}

module.exports = { scanDirSync };
