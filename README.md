# DiskStat

Analyseur d'utilisation disque avec interface web, rendu treemap squarified et mises à jour en temps réel via Server-Sent Events.

## Fonctionnalités

- Scan récursif configurable (profondeur 2–6)
- Visualisation treemap squarified interactive
- Progression en temps réel (SSE)
- Annulation de scan en cours
- Masquer/afficher les fichiers cachés
- Suppression et déplacement de fichiers depuis l'interface
- Mise à jour instantanée de l'arbre sans nouveau scan
- Historique des scans (localStorage)
- Menu contextuel et modales d'information

## Structure

```
source/
├── Dockerfile
├── public/
│   ├── index.html
│   ├── css/
│   │   └── main.css
│   └── js/
│       ├── config.js      — couleurs par extension
│       ├── format.js      — formatSize, getColor, formatTime
│       ├── state.js       — variables d'état global
│       ├── treemap.js     — algorithme squarify + rendu
│       ├── fileList.js    — liste latérale + fil d'Ariane
│       ├── ui.js          — renderAll, patchTreeRemove
│       ├── scan.js        — flux SSE + annulation
│       ├── history.js     — historique localStorage
│       ├── fileOps.js     — menu contextuel + modales
│       └── events.js      — clavier, resize, init
└── src/
    ├── index.js           — point d'entrée HTTP
    ├── router.js          — aiguillage des routes
    ├── config.js          — constantes globales
    ├── paths.js           — conversion de chemins
    ├── bodyParser.js      — lecture du corps JSON
    ├── sse.js             — gestion des connexions SSE
    ├── scanner.js         — scan récursif + Worker thread
    ├── scanManager.js     — cycle de vie des scans
    └── handlers/
        ├── scanStream.js  — GET /api/scan-stream
        ├── scanCancel.js  — POST /api/scan/cancel
        └── fileOps.js     — delete, move, list, info, du
```

## Démarrage rapide

```bash
docker build -t diskstat ./source
docker run -p 3000:3000 -v /home/monsieurz:/host diskstat
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Aucune — la configuration est centralisée dans `src/config.js`.

Le montage `/host` est détecté automatiquement : si `/host` existe dans le conteneur, tous les chemins utilisateur sont préfixés par `/host` pour accéder au système de fichiers de l'hôte.
