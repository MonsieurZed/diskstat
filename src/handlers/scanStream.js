/**
 * @file handlers/scanStream.js
 * @description Gestionnaire de la route GET /api/scan-stream.
 *              Rattache le client SSE à un scan existant ou en démarre un nouveau.
 */

'use strict';

const { MAX_DEPTH }                = require('../config');
const { toRealPath }               = require('../paths');
const { activeScans, createScan }  = require('../scanManager');
const { subscribeSse }             = require('../sse');

/**
 * Gère la connexion SSE d'un client pour suivre un scan en temps réel.
 * @param {http.IncomingMessage} req - Requête HTTP entrante.
 * @param {http.ServerResponse}  res - Réponse HTTP à transformer en flux SSE.
 * @param {Object}               query - Paramètres de requête déjà parsés.
 */
function handleScanStream(req, res, query) {
  const scanId = query.id;

  if (scanId) {
    const scan = activeScans.get(scanId);
    if (!scan) {
      res.writeHead(200, {
        'Content-Type':    'text/event-stream',
        'Cache-Control':   'no-cache',
        'Connection':      'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(`data: ${JSON.stringify({ type: 'expired' })}\n\n`);
      res.end();
      return;
    }
    subscribeSse(res, scan);
    req.on('close', () => { scan.listeners.delete(res); });
    return;
  }

  const userPath   = query.path || '/';
  const depth      = Math.min(parseInt(query.depth) || MAX_DEPTH, MAX_DEPTH);
  const hideHidden = query.hideHidden !== '0';
  const realPath   = toRealPath(userPath);

  const scan = createScan(userPath, realPath, depth, hideHidden);
  subscribeSse(res, scan);
  req.on('close', () => { scan.listeners.delete(res); });
}

module.exports = { handleScanStream };
