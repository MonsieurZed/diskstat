/**
 * @file handlers/scanCancel.js
 * @description Gestionnaire de la route POST /api/scan/cancel.
 *              Termine le Worker d'un scan en cours et notifie les clients SSE.
 */

'use strict';

const { readBody }                                          = require('../bodyParser');
const { activeScans }                                       = require('../scanManager');
const { broadcast, closeAllListeners, scheduleScanCleanup } = require('../sse');

/**
 * Annule un scan en cours d'exécution.
 * @param {http.IncomingMessage} req - Requête HTTP entrante (body JSON avec `id`).
 * @param {http.ServerResponse}  res - Réponse HTTP.
 */
async function handleScanCancel(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  try {
    const body   = await readBody(req);
    const scanId = body.id;
    if (!scanId) { res.end(JSON.stringify({ error: 'Missing scan id' })); return; }

    const scan = activeScans.get(scanId);
    if (!scan) { res.end(JSON.stringify({ error: 'Scan not found' })); return; }
    if (scan.status !== 'running') { res.end(JSON.stringify({ error: 'Scan is not running' })); return; }

    scan.status   = 'cancelled';
    scan.doneTime = Date.now();
    if (scan.worker) await scan.worker.terminate();
    broadcast(scan, { type: 'cancelled' });
    closeAllListeners(scan);
    scheduleScanCleanup(scanId);
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.end(JSON.stringify({ error: err.message }));
  }
}

module.exports = { handleScanCancel };
