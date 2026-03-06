/**
 * @file config.js
 * @description Constantes globales de configuration de l'application.
 *              Centralise toutes les valeurs configurables en un seul endroit.
 */

'use strict';

const fs = require('fs');

const PORT        = 3000;
const MAX_DEPTH   = 6;
const MIN_SIZE    = 1024 * 1024;
const SCAN_TTL    = 30 * 60 * 1000;
const HOST_ROOT   = fs.existsSync('/host') ? '/host' : '';

const PROTECTED_PATHS = [
  '/', '/bin', '/boot', '/dev', '/etc',
  '/lib', '/lib64', '/proc', '/run', '/sbin',
  '/sys', '/usr', '/snap',
];

const SKIP_PATHS = ['/proc', '/sys', '/dev', '/run', '/snap'];

module.exports = { PORT, MAX_DEPTH, MIN_SIZE, SCAN_TTL, HOST_ROOT, PROTECTED_PATHS, SKIP_PATHS };
