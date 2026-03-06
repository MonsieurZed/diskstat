/**
 * @file bodyParser.js
 * @description Utilitaire de lecture et de décodage du corps des requêtes HTTP JSON.
 */

'use strict';

/**
 * Lit le corps d'une requête HTTP entrante et le désérialise depuis JSON.
 * @param {http.IncomingMessage} req - Requête HTTP Node.js.
 * @returns {Promise<Object>} Corps de la requête désérialisé.
 * @throws {Error} Si le JSON est invalide ou la lecture échoue.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('JSON invalide')); }
    });
    req.on('error', reject);
  });
}

module.exports = { readBody };
