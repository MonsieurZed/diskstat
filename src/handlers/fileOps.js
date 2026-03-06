/**
 * @file handlers/fileOps.js
 * @description Gestionnaires des routes de manipulation et d'inspection de fichiers :
 *              /api/delete, /api/move, /api/list, /api/info, /api/du, /api/scan, /api/scans.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { MAX_DEPTH }              = require('../config');
const { toRealPath, toDisplayPath, isProtectedPath } = require('../paths');
const { readBody }               = require('../bodyParser');
const { activeScans }            = require('../scanManager');
const { scanDirSync }            = require('../scanner');

/**
 * GET /api/scans — Retourne la liste des scans actifs avec leur statut.
 * @param {http.ServerResponse} res
 */
function handleScans(res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  const scans = [];
  for (const [id, scan] of activeScans) {
    scans.push({
      id,
      path:        scan.path,
      status:      scan.status,
      pct:         scan.lastProgress ? scan.lastProgress.pct || 0 : 0,
      currentPath: scan.lastProgress ? scan.lastProgress.currentPath || '' : '',
      startTime:   scan.startTime,
    });
  }
  res.end(JSON.stringify(scans));
}

/**
 * GET /api/scan — Scan synchrone (bloquant) d'un répertoire.
 * @param {http.ServerResponse} res
 * @param {Object} query - Paramètres de requête (`path`, `depth`).
 */
function handleScanSync(res, query) {
  const userPath = query.path || '/';
  const depth    = Math.min(parseInt(query.depth) || MAX_DEPTH, MAX_DEPTH);
  const realPath = toRealPath(userPath);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const data = scanDirSync(realPath, 0, depth);
    res.end(JSON.stringify(data));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/du — Retourne l'utilisation disque via `du` pour un répertoire.
 * @param {http.ServerResponse} res
 * @param {Object} query
 */
function handleDu(res, query) {
  const userPath = query.path || '/';
  const depth    = parseInt(query.depth) || 1;
  const realPath = toRealPath(userPath);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const output = execSync(
      `du -b --max-depth=${depth} "${realPath}" 2>/dev/null | sort -rn | head -100`,
      { timeout: 60000 }
    ).toString().trim();
    const lines = output.split('\n').map(line => {
      const [size, ...pathParts] = line.split('\t');
      return { size: parseInt(size) || 0, path: toDisplayPath(pathParts.join('\t')) };
    });
    res.end(JSON.stringify(lines));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/list — Liste le contenu immédiat d'un répertoire.
 * @param {http.ServerResponse} res
 * @param {Object} query
 */
function handleList(res, query) {
  const userPath = query.path || '/';
  const realPath = toRealPath(userPath);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const entries = fs.readdirSync(realPath, { withFileTypes: true });
    const items   = [];
    for (const entry of entries) {
      const fullPath = path.join(realPath, entry.name);
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) continue;
        items.push({
          name:  entry.name,
          path:  toDisplayPath(fullPath),
          isDir: stat.isDirectory(),
          size:  stat.isFile() ? stat.size : 0,
        });
      } catch { /* skip */ }
    }
    res.end(JSON.stringify(items));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * GET /api/info — Retourne les métadonnées d'un fichier ou répertoire.
 * @param {http.ServerResponse} res
 * @param {Object} query
 */
function handleInfo(res, query) {
  const userPath = query.path || '/';
  const realPath = toRealPath(userPath);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const stat  = fs.statSync(realPath);
    const lstat = fs.lstatSync(realPath);
    res.end(JSON.stringify({
      path:      userPath,
      name:      path.basename(realPath) || '/',
      isDir:     stat.isDirectory(),
      isFile:    stat.isFile(),
      isSymlink: lstat.isSymbolicLink(),
      size:      stat.size,
      mode:      '0' + (stat.mode & 0o7777).toString(8),
      uid:       stat.uid,
      gid:       stat.gid,
      atime:     stat.atime,
      mtime:     stat.mtime,
      ctime:     stat.ctime,
      birthtime: stat.birthtime,
    }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/delete — Supprime un fichier ou répertoire (récursif).
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse}  res
 */
async function handleDelete(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const body     = await readBody(req);
    const userPath = body.path;
    if (!userPath) { res.end(JSON.stringify({ error: 'Missing path' })); return; }
    if (isProtectedPath(userPath)) { res.end(JSON.stringify({ error: 'Cannot delete protected system path' })); return; }
    const realPath = toRealPath(userPath);
    const stat     = fs.lstatSync(realPath);
    fs.rmSync(realPath, { recursive: true, force: true });
    res.end(JSON.stringify({ ok: true, deleted: userPath, wasDir: stat.isDirectory() }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/move — Déplace ou renomme un fichier ou répertoire.
 * Utilise `cp -a` + `rm` si la source et la destination sont sur des systèmes de fichiers différents.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse}  res
 */
async function handleMove(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const body                = await readBody(req);
    const { source, destination } = body;
    if (!source || !destination) { res.end(JSON.stringify({ error: 'Missing source or destination' })); return; }
    if (isProtectedPath(source)) { res.end(JSON.stringify({ error: 'Cannot move protected system path' })); return; }

    const realSource = toRealPath(source);
    const realDest   = toRealPath(destination);
    let finalDest    = realDest;

    try {
      if (fs.statSync(realDest).isDirectory()) {
        finalDest = path.join(realDest, path.basename(realSource));
      }
    } catch {}

    try {
      fs.renameSync(realSource, finalDest);
    } catch (renameErr) {
      if (renameErr.code === 'EXDEV') {
        execSync(`cp -a "${realSource}" "${finalDest}" && rm -rf "${realSource}"`, { timeout: 300000 });
      } else {
        throw renameErr;
      }
    }

    res.end(JSON.stringify({ ok: true, from: source, to: toDisplayPath(finalDest) }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = { handleScans, handleScanSync, handleDu, handleList, handleInfo, handleDelete, handleMove };
