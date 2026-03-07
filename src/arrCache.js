/**
 * @file arrCache.js
 * @description Cache des données Radarr, Sonarr et Tautulli.
 *              Charge les listes au démarrage et les rafraîchit périodiquement.
 *              Fournit une fonction d'enrichissement de l'arbre de scan.
 */

'use strict';

const http = require('http');
const path = require('path');

const SONARR_URL     = process.env.SONARR_URL || '';
const SONARR_API_KEY = process.env.SONARR_API_KEY || '';
const RADARR_URL     = process.env.RADARR_URL || '';
const RADARR_API_KEY = process.env.RADARR_API_KEY || '';
const SONARR_PUBLIC  = process.env.SONARR_PUBLIC_URL || '';
const RADARR_PUBLIC  = process.env.RADARR_PUBLIC_URL || '';
const TAUTULLI_URL     = process.env.TAUTULLI_URL || '';
const TAUTULLI_API_KEY = process.env.TAUTULLI_API_KEY || '';

const REFRESH_INTERVAL = 5 * 60 * 1000;

const VIDEO_EXTS = new Set([
  '.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts',
]);

/**
 * Tableau de correspondance entre chemins Explorerr et chemins Arr.
 * @type {Array<{from: string, to: string}>}
 */
const PATH_MAP = (process.env.ARR_PATH_MAP || '').split(',').filter(Boolean).map((entry) => {
  const [from, to] = entry.split(':');
  return { from, to };
});

let radarrMovies = [];
let sonarrSeries = [];
let tautulliHistory = new Map();

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
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * Convertit un chemin Arr en chemin Explorerr (inverse du PATH_MAP).
 * @param {string} arrPath - Chemin tel que vu par Radarr/Sonarr.
 * @returns {string} Chemin dans le conteneur Explorerr.
 */
function fromArrPath(arrPath) {
  for (const { from, to } of PATH_MAP) {
    if (arrPath.startsWith(to)) {
      return from + arrPath.slice(to.length);
    }
  }
  return arrPath;
}

/**
 * Charge la liste des films Radarr et la transforme en index par chemin Explorerr.
 */
async function loadRadarr() {
  if (!RADARR_URL || !RADARR_API_KEY) return;
  try {
    const movies = await httpGet(`${RADARR_URL}/api/v3/movie?apikey=${RADARR_API_KEY}`);
    if (!Array.isArray(movies)) return;
    radarrMovies = movies.map((m) => ({
      diskPath: fromArrPath(m.path || ''),
      filePath: m.movieFile ? fromArrPath(m.movieFile.path || '') : null,
      title:    m.title,
      url:      `${RADARR_PUBLIC}/movie/${m.titleSlug}`,
      id:       m.id,
    }));
    console.log(`[arrCache] Radarr: ${radarrMovies.length} films chargés`);
  } catch (err) {
    console.error(`[arrCache] Radarr error: ${err.message}`);
  }
}

/**
 * Charge la liste des séries Sonarr et la transforme en index par chemin Explorerr.
 */
async function loadSonarr() {
  if (!SONARR_URL || !SONARR_API_KEY) return;
  try {
    const series = await httpGet(`${SONARR_URL}/api/v3/series?apikey=${SONARR_API_KEY}`);
    if (!Array.isArray(series)) return;
    sonarrSeries = series.map((s) => ({
      diskPath: fromArrPath(s.path || ''),
      title:    s.title,
      url:      `${SONARR_PUBLIC}/series/${s.titleSlug}`,
      id:       s.id,
    }));
    console.log(`[arrCache] Sonarr: ${sonarrSeries.length} séries chargées`);
  } catch (err) {
    console.error(`[arrCache] Sonarr error: ${err.message}`);
  }
}

/**
 * Charge l'historique complet Tautulli et construit un compteur par titre.
 */
async function loadTautulli() {
  if (!TAUTULLI_URL || !TAUTULLI_API_KEY) return;
  try {
    const resp = await httpGet(
      `${TAUTULLI_URL}/api/v2?apikey=${TAUTULLI_API_KEY}&cmd=get_history&length=99999`
    );
    if (!resp || !resp.response || resp.response.result !== 'success') return;

    const entries = resp.response.data.data || [];
    const counts  = new Map();
    for (const entry of entries) {
      const title = (entry.full_title || '').toLowerCase();
      if (title) counts.set(title, (counts.get(title) || 0) + 1);
    }
    tautulliHistory = counts;
    console.log(`[arrCache] Tautulli: ${entries.length} entrées, ${counts.size} titres uniques`);
  } catch (err) {
    console.error(`[arrCache] Tautulli error: ${err.message}`);
  }
}

/**
 * Charge toutes les données en parallèle.
 */
async function refreshAll() {
  await Promise.all([loadRadarr(), loadSonarr(), loadTautulli()]);
}

/**
 * Cherche un match Radarr/Sonarr pour un chemin Explorerr donné.
 * @param {string} diskPath - Chemin complet dans le conteneur Explorerr (/host/...).
 * @returns {Object|null} Données Arr {service, title, url, id} ou null.
 */
function findArrMatch(diskPath) {
  for (const m of radarrMovies) {
    if (m.filePath && diskPath === m.filePath) {
      return { service: 'radarr', title: m.title, url: m.url, id: m.id };
    }
    if (diskPath.startsWith(m.diskPath + '/') || diskPath === m.diskPath) {
      return { service: 'radarr', title: m.title, url: m.url, id: m.id };
    }
  }
  for (const s of sonarrSeries) {
    if (diskPath.startsWith(s.diskPath + '/') || diskPath === s.diskPath) {
      return { service: 'sonarr', title: s.title, url: s.url, id: s.id };
    }
  }
  return null;
}

/**
 * Cherche le nombre de visionnages pour un titre Arr donné.
 * @param {string} arrTitle - Titre du film ou de la série.
 * @returns {number} Nombre de visionnages trouvés.
 */
function findWatchCount(arrTitle) {
  if (!arrTitle) return 0;
  const key = arrTitle.toLowerCase();
  return tautulliHistory.get(key) || 0;
}

/**
 * Enrichit récursivement un arbre de scan avec les données Arr et Tautulli.
 * Ajoute les propriétés `arr` et `watchCount` aux nœuds correspondants.
 * @param {Object} node     - Nœud de l'arbre de scan.
 * @param {string} hostRoot - Préfixe du chemin hôte (ex: "/host").
 */
function enrichTree(node, hostRoot) {
  const realPath = hostRoot + node.path;
  const isFile   = !node.children || node.children.length === 0;
  const isVideo  = isFile && VIDEO_EXTS.has((node.name.match(/\.[^.]+$/) || [''])[0].toLowerCase());

  const arrMatch = findArrMatch(realPath);
  if (arrMatch) {
    node.arr = arrMatch;
    if (isVideo || isFile) {
      node.watchCount = findWatchCount(arrMatch.title);
    }
  }

  if (node.children) {
    for (const child of node.children) {
      enrichTree(child, hostRoot);
    }
  }
}

refreshAll();
setInterval(refreshAll, REFRESH_INTERVAL);

module.exports = { enrichTree, refreshAll, findArrMatch, findWatchCount };
