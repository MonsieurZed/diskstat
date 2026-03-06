/**
 * @file scanManager.js
 * @description Gestion du cycle de vie des scans actifs.
 *              Crée les Workers, maintient la Map des scans et orchestre
 *              les événements de progression, fin et erreur.
 */

'use strict';

const crypto = require('crypto');
const path   = require('path');
const { Worker } = require('worker_threads');

const { SCAN_TTL }                                          = require('./config');
const { broadcast, closeAllListeners, scheduleScanCleanup } = require('./sse');

/**
 * Map des scans actifs indexés par leur identifiant unique.
 * @type {Map<string, Object>}
 */
const activeScans = new Map();

/**
 * Crée un nouveau scan et lance son Worker thread.
 * @param {string}  userPath  - Chemin affiché à l'utilisateur.
 * @param {string}  realPath  - Chemin réel dans le conteneur.
 * @param {number}  maxDepth  - Profondeur maximale de scan.
 * @param {boolean} hideHidden - Si vrai, les fichiers cachés sont ignorés.
 * @returns {Object} L'objet scan créé et enregistré dans activeScans.
 */
function createScan(userPath, realPath, maxDepth, hideHidden) {
  const id   = crypto.randomBytes(8).toString('hex');
  const scan = {
    id,
    path:         userPath,
    status:       'running',
    lastProgress: { type: 'progress', currentPath: userPath, pct: 0 },
    result:       null,
    error:        null,
    listeners:    new Set(),
    startTime:    Date.now(),
    worker:       null,
  };

  const workerScript = path.join(__dirname, 'scanner.js');
  const worker = new Worker(workerScript, {
    workerData: { scanPath: realPath, maxDepth, hideHidden: !!hideHidden },
  });

  scan.worker = worker;

  worker.on('message', (msg) => {
    if (msg.type === 'progress') {
      scan.lastProgress = { type: 'progress', ...msg };
      broadcast(scan, scan.lastProgress);
    }
    if (msg.type === 'done') {
      scan.status   = 'done';
      scan.result   = msg.data;
      scan.doneTime = Date.now();
      broadcast(scan, { type: 'done', data: msg.data });
      closeAllListeners(scan);
      scheduleScanCleanup(id);
    }
  });

  worker.on('error', (err) => {
    scan.status   = 'error';
    scan.error    = err.message;
    scan.doneTime = Date.now();
    broadcast(scan, { type: 'error', error: err.message });
    closeAllListeners(scan);
    scheduleScanCleanup(id);
  });

  worker.on('exit', (code) => {
    if (scan.status === 'running' && code !== 0) {
      scan.status   = 'error';
      scan.error    = 'Worker exited with code ' + code;
      scan.doneTime = Date.now();
      broadcast(scan, { type: 'error', error: scan.error });
      closeAllListeners(scan);
      scheduleScanCleanup(id);
    }
    // Le statut 'cancelled' est géré par le handler /api/scan/cancel
  });

  activeScans.set(id, scan);
  return scan;
}

module.exports = { activeScans, createScan };
