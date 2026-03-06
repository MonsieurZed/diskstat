/**
 * @file router.js
 * @description Aiguillage des requêtes HTTP vers les gestionnaires appropriés.
 *              Centralise toutes les routes de l'API et le service des fichiers statiques.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const url  = require('url');

const { handleScanStream }                                                    = require('./handlers/scanStream');
const { handleScanCancel }                                                    = require('./handlers/scanCancel');
const { handleScans, handleScanSync, handleDu, handleList, handleInfo, handleDelete, handleMove } = require('./handlers/fileOps');

/**
 * Types MIME supportés pour les fichiers statiques.
 * @type {Object.<string, string>}
 */
const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

/**
 * Chemin absolu vers le répertoire des fichiers statiques.
 * @type {string}
 */
const PUBLIC_DIR = path.join(__dirname, '../public');

/**
 * Gestionnaire principal des requêtes HTTP.
 * Achemine chaque requête vers le bon handler ou sert le fichier statique correspondant.
 * @param {http.IncomingMessage} req - Requête HTTP entrante.
 * @param {http.ServerResponse}  res - Réponse HTTP.
 */
async function router(req, res) {
  const parsed = url.parse(req.url, true);
  const { pathname, query } = parsed;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (pathname === '/api/scan-stream') {
    handleScanStream(req, res, query);
    return;
  }

  if (pathname === '/api/scans') {
    handleScans(res);
    return;
  }

  if (pathname === '/api/scan') {
    handleScanSync(res, query);
    return;
  }

  if (pathname === '/api/du') {
    handleDu(res, query);
    return;
  }

  if (pathname === '/api/list') {
    handleList(res, query);
    return;
  }

  if (pathname === '/api/info') {
    handleInfo(res, query);
    return;
  }

  if (pathname === '/api/delete' && req.method === 'POST') {
    await handleDelete(req, res);
    return;
  }

  if (pathname === '/api/move' && req.method === 'POST') {
    await handleMove(req, res);
    return;
  }

  if (pathname === '/api/scan/cancel' && req.method === 'POST') {
    await handleScanCancel(req, res);
    return;
  }

  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? '/index.html' : pathname);
  const ext      = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(data);
  });
}

module.exports = { router };
