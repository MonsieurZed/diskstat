# DiskStat — Architecture Map

> Mise à jour : 2026-03-06
> Version : v1.1.0

---

## Vue d'ensemble

DiskStat est un analyseur d'utilisation disque avec interface web.
Le backend Node.js scanne le système de fichiers via un Worker thread et
diffuse la progression en temps réel via Server-Sent Events.
Le frontend vanilla JS affiche les données sous forme de treemap squarified.

---

## Structure des répertoires

```
source/
├── Dockerfile                  — image Node 20 Alpine
├── README.md                   — documentation utilisateur
├── screenshot.png              — capture d'écran
├── .gitignore
├── agent/
│   ├── docs/
│   │   └── architecture.md     — ce fichier (master map)
│   └── progress/               — historique des sessions de travail
├── public/                     — fichiers servis statiquement
│   ├── index.html              — structure HTML + chargement des scripts
│   ├── css/
│   │   └── main.css            — palette Tokyo Night, layout, composants
│   └── js/
│       ├── config.js           — EXT_COLORS, DIR_COLORS
│       ├── format.js           — formatSize(), getColor(), formatTime()
│       ├── state.js            — currentData, navStack, tooltip (état global)
│       ├── treemap.js          — squarify(), renderTreemap(), attachTooltip()
│       ├── fileList.js         — renderFileList(), renderBreadcrumb(), renderExtLegend()
│       ├── ui.js               — renderAll(), updateStatus(), patchTreeRemove()
│       ├── scan.js             — showScanUI(), hideScanUI(), cancelScan(),
│       │                          connectToScan(), startScan(), reconnectToScan()
│       ├── history.js          — getScanHistory(), saveScanToHistory(),
│       │                          loadFromHistory(), deleteFromHistory(),
│       │                          renderHistory(), getRelativeTime()
│       ├── fileOps.js          — attachContextMenu(), hideContextMenu(),
│       │                          openDeleteModal(), openInfoModal(), openMoveModal(),
│       │                          loadMoveDir(), copyToClipboard()
│       └── events.js           — keydown, resize, load (init)
└── src/                        — backend Node.js (CommonJS)
    ├── index.js                — point d'entrée HTTP (crée le serveur, appelle init SSE)
    ├── router.js               — aiguillage de toutes les routes + fichiers statiques
    ├── config.js               — PORT, MAX_DEPTH, MIN_SIZE, SCAN_TTL, HOST_ROOT,
    │                              PROTECTED_PATHS, SKIP_PATHS
    ├── paths.js                — toRealPath(), toDisplayPath(), isProtectedPath()
    ├── bodyParser.js           — readBody()
    ├── sse.js                  — init(), broadcast(), closeAllListeners(),
    │                              scheduleScanCleanup(), subscribeSse()
    ├── scanner.js              — applyMaxItems(), scanDirSync(),
    │                              bloc Worker thread (!isMainThread)
    ├── scanManager.js          — activeScans (Map), createScan()
    └── handlers/
        ├── scanStream.js       — GET /api/scan-stream
        ├── scanCancel.js       — POST /api/scan/cancel
        └── fileOps.js          — GET /api/scans, /api/scan, /api/du, /api/list, /api/info
                                   POST /api/delete, /api/move
```

---

## Flux de données principal

```
[Browser] startScan()
    │
    ▼
GET /api/scan-stream?path=...&depth=...&hideHidden=...&showAll=...
    │
    ▼
handleScanStream() → createScan() → new Worker(scanner.js, workerData)
    │                                         │
    │                                 scanDirSync() récursif
    │                                 postMessage(progress / done)
    │
    ├── SSE progress → progressBar + progressPath
    └── SSE done → renderAll(data) → renderTreemap() + renderFileList() + renderBreadcrumb()
```

---

## Routes API

| Méthode | Route               | Handler            | Description                         |
|---------|---------------------|--------------------|-------------------------------------|
| GET     | /api/scan-stream    | scanStream.js      | Démarre ou rejoint un scan SSE      |
| POST    | /api/scan/cancel    | scanCancel.js      | Annule un Worker en cours           |
| GET     | /api/scans          | fileOps.js         | Liste des scans actifs              |
| GET     | /api/scan           | fileOps.js         | Scan synchrone (bloquant)           |
| GET     | /api/du             | fileOps.js         | Tailles via `du`                    |
| GET     | /api/list           | fileOps.js         | Contenu immédiat d'un répertoire    |
| GET     | /api/info           | fileOps.js         | Métadonnées d'un fichier            |
| POST    | /api/delete         | fileOps.js         | Suppression récursive               |
| POST    | /api/move           | fileOps.js         | Déplacement / renommage             |

---

## Paramètres de scan (SSE)

| Paramètre   | Type    | Défaut | Description                                      |
|-------------|---------|--------|--------------------------------------------------|
| path        | string  | `/`    | Chemin à scanner (côté utilisateur)              |
| depth       | number  | 4      | Profondeur maximale (2–6)                        |
| hideHidden  | `0`/`1` | `1`    | Ignorer les fichiers commençant par `.`          |
| showAll     | `0`/`1` | `0`    | Désactiver le plafond de 200 enfants par nœud   |
| id          | string  | —      | Rejoindre un scan existant par son identifiant   |

---

## État frontend (globals)

| Variable      | Fichier    | Type    | Description                                  |
|---------------|------------|---------|----------------------------------------------|
| currentData   | state.js   | Object  | Nœud actuellement affiché dans la treemap    |
| navStack      | state.js   | Array   | Pile de navigation (nœuds parcourus)         |
| tooltip       | state.js   | Element | Référence à l'élément tooltip du DOM         |
| activeScanId  | scan.js    | string  | ID SSE du scan en cours                      |
| activeEvtSource | scan.js  | EventSource | Connexion SSE active                    |
| isCancelling  | scan.js    | boolean | Verrou anti-reconnexion lors d'annulation    |
| ctxTarget     | fileOps.js | Object  | Nœud visé par le menu contextuel             |
| deleteTargetPath | fileOps.js | string | Chemin cible de la modale delete          |
| moveSourcePath | fileOps.js | string | Chemin source de la modale move            |
| moveCurrentDir | fileOps.js | string | Répertoire destination courant (move)      |

---

## Dépendances inter-modules frontend

Ordre de chargement dans `index.html` (global scope, pas d'ES modules) :

```
config.js → format.js → state.js → treemap.js → fileList.js
→ ui.js → scan.js → history.js → fileOps.js → events.js
```

Chaque module aval peut appeler les fonctions des modules amont.

---

## Infrastructure de déploiement

| Environnement | Stack                         | Port | Domaine              |
|---------------|-------------------------------|------|----------------------|
| Dev           | diskstat-dev/compose.yaml     | 8070 | diskstat.dev.[domain]|
| Production    | diskstat/compose.yaml         | 8071 | diskstat.zed.cx      |

Image Docker : `node:20-alpine`, aucune dépendance npm (modules Node natifs uniquement).
