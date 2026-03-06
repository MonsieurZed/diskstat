/**
 * @file paths.js
 * @description Utilitaires de conversion entre chemins utilisateur et chemins réels
 *              sur le système de fichiers monté dans le conteneur.
 */

'use strict';

const path = require('path');
const { HOST_ROOT, PROTECTED_PATHS } = require('./config');

/**
 * Convertit un chemin utilisateur (affiché) en chemin réel dans le conteneur.
 * @param {string} userPath - Chemin tel que saisi par l'utilisateur.
 * @returns {string} Chemin absolu résolu dans le conteneur.
 */
function toRealPath(userPath) {
  const cleaned = path.resolve('/', userPath);
  return HOST_ROOT + cleaned;
}

/**
 * Convertit un chemin réel du conteneur en chemin d'affichage utilisateur.
 * @param {string} realPath - Chemin absolu dans le conteneur.
 * @returns {string} Chemin affiché à l'utilisateur.
 */
function toDisplayPath(realPath) {
  if (HOST_ROOT && realPath.startsWith(HOST_ROOT)) {
    const display = realPath.slice(HOST_ROOT.length);
    return display || '/';
  }
  return realPath;
}

/**
 * Vérifie si un chemin utilisateur correspond à un répertoire système protégé.
 * @param {string} userPath - Chemin tel que saisi par l'utilisateur.
 * @returns {boolean} Vrai si le chemin est protégé.
 */
function isProtectedPath(userPath) {
  const cleaned = path.resolve('/', userPath);
  return PROTECTED_PATHS.includes(cleaned);
}

module.exports = { toRealPath, toDisplayPath, isProtectedPath };
