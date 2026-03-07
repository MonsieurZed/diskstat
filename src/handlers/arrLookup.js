/**
 * @file handlers/arrLookup.js
 * @description Recherche d'un fichier média dans Radarr et Sonarr à partir de son chemin.
 *              Retourne l'URL publique vers la page du film ou de la série correspondante.
 */

'use strict';

const http = require('http');
const { toRealPath } = require('../paths');

const SONARR_URL      = process.env.SONARR_URL || '';
const SONARR_API_KEY  = process.env.SONARR_API_KEY || '';
const RADARR_URL      = process.env.RADARR_URL || '';
const RADARR_API_KEY  = process.env.RADARR_API_KEY || '';
const SONARR_PUBLIC   = process.env.SONARR_PUBLIC_URL || '';
const RADARR_PUBLIC   = process.env.RADARR_PUBLIC_URL || '';

/**
 * Tableau de correspondance entre chemins Explorerr et chemins Arr.
 * Chargé depuis ARR_PATH_MAP (format: "/host/library:/data/library,/host/seed:/data/seed").
 * @type {Array<{from: string, to: string}>}
 */
const PATH_MAP = (process.env.ARR_PATH_MAP || '').split(',').filter(Boolean).map((entry) => {
  const [from, to] = entry.split(':');
  return { from, to };
});

/**
 * Convertit un chemin réel Explorerr en chemin tel que vu par Radarr/Sonarr.
 * @param {string} realPath - Chemin dans le conteneur Explorerr (/host/...).
 * @returns {string} Chemin converti pour Arr (/data/...).
 */
function toArrPath(realPath) {
  for (const { from, to } of PATH_MAP) {
    if (realPath.startsWith(from)) {
      return to + realPath.slice(from.length);
    }
  }
  return realPath;
}

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
 * Recherche un film dans Radarr dont un fichier correspond au chemin donné.
 * @param {string} arrPath - Chemin du fichier tel que vu par Radarr.
 * @returns {Promise<Object|null>} Objet {service, title, url} ou null.
 */
async function lookupRadarr(arrPath) {
  if (!RADARR_URL || !RADARR_API_KEY) return null;
  try {
    const movies = await httpGet(`${RADARR_URL}/api/v3/movie?apikey=${RADARR_API_KEY}`);
    if (!Array.isArray(movies)) return null;
    for (const movie of movies) {
      if (movie.movieFile && movie.movieFile.path === arrPath) {
        return {
          service: 'radarr',
          title:   movie.title,
          url:     `${RADARR_PUBLIC}/movie/${movie.titleSlug}`,
          id:      movie.id,
        };
      }
      if (movie.path && arrPath.startsWith(movie.path)) {
        return {
          service: 'radarr',
          title:   movie.title,
          url:     `${RADARR_PUBLIC}/movie/${movie.titleSlug}`,
          id:      movie.id,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Recherche une série dans Sonarr dont le chemin du fichier correspond.
 * @param {string} arrPath - Chemin du fichier tel que vu par Sonarr.
 * @returns {Promise<Object|null>} Objet {service, title, url} ou null.
 */
async function lookupSonarr(arrPath) {
  if (!SONARR_URL || !SONARR_API_KEY) return null;
  try {
    const series = await httpGet(`${SONARR_URL}/api/v3/series?apikey=${SONARR_API_KEY}`);
    if (!Array.isArray(series)) return null;
    for (const show of series) {
      if (show.path && arrPath.startsWith(show.path)) {
        return {
          service: 'sonarr',
          title:   show.title,
          url:     `${SONARR_PUBLIC}/series/${show.titleSlug}`,
          id:      show.id,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Gestionnaire de la route /api/arr-lookup.
 * @param {http.ServerResponse} res   - Réponse HTTP.
 * @param {Object}              query - Paramètres de requête (path).
 */
async function handleArrLookup(res, query) {
  const userPath = query.path;
  if (!userPath) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'path required' }));
    return;
  }

  const realPath = toRealPath(userPath);
  const arrPath  = toArrPath(realPath);

  const [radarr, sonarr] = await Promise.all([
    lookupRadarr(arrPath),
    lookupSonarr(arrPath),
  ]);

  const result = radarr || sonarr || null;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

module.exports = { handleArrLookup };
