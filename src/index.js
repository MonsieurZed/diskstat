/**
 * @file index.js
 * @description Point d'entrée du serveur HTTP Explorerr.
 *              Initialise les modules interdépendants et démarre l'écoute.
 */

'use strict';

const http = require('http');

const { PORT }         = require('./config');
const { activeScans }  = require('./scanManager');
const { init: initSse } = require('./sse');
const { router }       = require('./router');

initSse(activeScans);

const server = http.createServer(router);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Explorerr server running on http://0.0.0.0:${PORT}`);
});
