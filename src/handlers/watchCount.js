/**
 * @file handlers/watchCount.js
 * @description Récupération du nombre de visionnages d'un fichier média via l'API Tautulli.
 *              Utilise get_history avec recherche par titre extrait du nom de fichier.
 */

'use strict';

const http = require('http');
const path = require('path');

const TAUTULLI_URL     = process.env.TAUTULLI_URL || '';
const TAUTULLI_API_KEY = process.env.TAUTULLI_API_KEY || '';

/**
 * Effectue une requête GET HTTP et retourne le JSON parsé.
 * @param {string} urlStr - URL complète de la requête.
 * @returns {Promise<Object>} Données JSON de la réponse.
 */
function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const req = http.get(urlStr, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * Extrait un titre de recherche depuis un nom de fichier média.
 * Retire l'extension, les tags entre crochets, l'année entre parenthèses, etc.
 * @param {string} fileName - Nom de fichier complet.
 * @returns {string} Titre nettoyé pour la recherche.
 */
function extractSearchTitle(fileName) {
  let name = path.basename(fileName, path.extname(fileName));
  name = name.replace(/\{[^}]*\}/g, '');
  name = name.replace(/\[[^\]]*\]/g, '');
  name = name.replace(/\(\d{4}\)/g, '');
  name = name.replace(/[-_.]+/g, ' ').trim();
  name = name.replace(/\s+/g, ' ').trim();
  return name;
}

/**
 * Gestionnaire de la route /api/watch-count.
 * Interroge Tautulli pour le nombre de lectures d'un fichier donné.
 * @param {http.ServerResponse} res   - Réponse HTTP.
 * @param {Object}              query - Paramètres de requête (path).
 */
async function handleWatchCount(res, query) {
  const userPath = query.path;
  if (!userPath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'path required' }));
    return;
  }

  if (!TAUTULLI_URL || !TAUTULLI_API_KEY) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: null }));
    return;
  }

  const searchTitle = extractSearchTitle(path.basename(userPath));

  try {
    const historyUrl = `${TAUTULLI_URL}/api/v2?apikey=${TAUTULLI_API_KEY}&cmd=get_history&search=${encodeURIComponent(searchTitle)}&length=1`;
    const result = await httpGet(historyUrl);

    if (!result || !result.response || result.response.result !== 'success') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: null }));
      return;
    }

    const count = result.response.data.recordsFiltered || 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count }));
  } catch {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: null }));
  }
}

module.exports = { handleWatchCount };
