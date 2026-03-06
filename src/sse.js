/**
 * @file sse.js
 * @description Gestion des connexions Server-Sent Events (SSE) pour la diffusion
 *              des événements de scan en temps réel vers les clients connectés.
 */

'use strict';

const { SCAN_TTL } = require('./config');

/**
 * Référence vers la Map des scans actifs (injectée au démarrage).
 * @type {Map<string, Object>}
 */
let activeScans = null;

/**
 * Initialise le module SSE avec la Map des scans actifs.
 * @param {Map<string, Object>} scansMap - Map partagée des scans actifs.
 */
function init(scansMap) {
  activeScans = scansMap;
}

/**
 * Diffuse un message JSON à tous les clients SSE abonnés à un scan.
 * @param {Object} scan - Objet scan contenant la liste des listeners.
 * @param {Object} msg  - Message à diffuser.
 */
function broadcast(scan, msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const res of scan.listeners) {
    try { res.write(data); } catch {}
  }
}

/**
 * Ferme proprement toutes les connexions SSE d'un scan et vide la liste.
 * @param {Object} scan - Objet scan dont les listeners doivent être fermés.
 */
function closeAllListeners(scan) {
  for (const res of scan.listeners) {
    try { res.end(); } catch {}
  }
  scan.listeners.clear();
}

/**
 * Programme la suppression automatique d'un scan après expiration du TTL.
 * @param {string} id - Identifiant unique du scan à nettoyer.
 */
function scheduleScanCleanup(id) {
  setTimeout(() => { activeScans.delete(id); }, SCAN_TTL);
}

/**
 * Abonne une réponse HTTP à un scan SSE existant.
 * Envoie immédiatement l'état courant du scan si déjà terminé ou en erreur.
 * @param {http.ServerResponse} res  - Réponse HTTP à abonner.
 * @param {Object}              scan - Objet scan cible.
 */
function subscribeSse(res, scan) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'scan-id', id: scan.id, path: scan.path })}\n\n`);

  if (scan.status === 'done') {
    res.write(`data: ${JSON.stringify({ type: 'progress', currentPath: scan.path, pct: 100 })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', data: scan.result })}\n\n`);
    res.end();
    return;
  }

  if (scan.status === 'error') {
    res.write(`data: ${JSON.stringify({ type: 'error', error: scan.error })}\n\n`);
    res.end();
    return;
  }

  if (scan.lastProgress) {
    res.write(`data: ${JSON.stringify(scan.lastProgress)}\n\n`);
  }

  scan.listeners.add(res);
}

module.exports = { init, broadcast, closeAllListeners, scheduleScanCleanup, subscribeSse };
