# Explorerr

Analyseur d'utilisation disque avec interface web, rendu treemap squarified et mises à jour en temps réel via Server-Sent Events.

## Fonctionnalités

- Scan récursif configurable (profondeur 2–6)
- Visualisation treemap squarified interactive et récursive
- Progression en temps réel (SSE) avec reconnexion automatique et compteur de dossiers `(N/M)`
- Annulation de scan en cours
- **Tout afficher** : désactive le plafond de 200 entrées par nœud
- Masquer/afficher les fichiers cachés (`.nom`) — activé par défaut
- **Masquer labels** : cache les textes dans les blocs treemap sans re-scan
- Tooltip enrichi : taille du nœud + chaîne complète d'ancêtres avec leurs tailles
- Clic sur un fichier → navigation vers son dossier parent
- Pourcentages `% vue` et `% total` dans la liste latérale et le tooltip
- Suppression et déplacement de fichiers depuis l'interface
- Menu contextuel + modales (info, delete, move)
- **Persistance UI** : chemin, profondeur, hide-hidden, hide-labels mémorisés (`localStorage`)
- **Panneau de configuration** : URLs + clés API Radarr / Sonarr / Tautulli, mappage de chemins
- Champs verrouillés automatiquement si définis via variables d'environnement
- Boutons **Test connexion** par service avec retour de version
- **Internationalisation** EN / FR / ES avec bascule en temps réel
- Logo SVG intégré au header

## Structure

```
source/
├── Dockerfile
├── README.md
├── agent/
│   ├── docs/architecture.md    — master map
│   └── progress/               — historique des sessions
├── public/
│   ├── index.html
│   ├── css/main.css
│   └── js/
│       ├── config.js      — couleurs par extension
│       ├── format.js      — formatSize, getColor, formatTime
│       ├── state.js       — variables d'état global
│       ├── treemap.js     — algorithme squarify + rendu + tooltip ancêtres
│       ├── fileList.js    — liste latérale + fil d'Ariane
│       ├── ui.js          — renderAll, patchTreeRemove
│       ├── scan.js        — flux SSE + annulation + compteur dossiers
│       ├── settings.js    — chargement config + verrouillage + test connexion
│       ├── i18n.js        — traductions EN/FR/ES
│       ├── fileOps.js     — menu contextuel + modales
│       └── events.js      — clavier, resize, persistance localStorage, init
└── src/
    ├── index.js
    ├── router.js
    ├── config.js
    ├── paths.js
    ├── bodyParser.js
    ├── sse.js
    ├── scanner.js
    ├── scanManager.js
    ├── arrCache.js        — cache Radarr / Sonarr / Tautulli
    └── handlers/
        ├── scanStream.js
        ├── scanCancel.js
        ├── fileOps.js
        ├── config.js      — GET/POST /api/config + /api/test-connection
        ├── arrLookup.js   — correspondance chemin ↔ média
        └── watchCount.js
```

## Démarrage rapide

```bash
docker build -t explorerr ./source
docker run -p 3000:3000 -v /home/monsieurz:/host explorerr
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Paramètres de scan

| Paramètre   | Défaut | Description                                       |
|-------------|--------|---------------------------------------------------|
| path        | `/`    | Chemin à scanner                                  |
| depth       | 4      | Profondeur maximale (2–6)                         |
| hideHidden  | `1`    | Ignorer les fichiers commençant par `.`           |
| showAll     | `0`    | Désactiver le plafond de 200 enfants par nœud    |

## Configuration

Les paramètres de connexion sont éditables via le panneau ⚙ ou injectés via variables d'environnement (champs alors verrouillés en lecture seule).

| Variable              | Description                            |
|-----------------------|----------------------------------------|
| `RADARR_URL`          | URL de base Radarr                     |
| `RADARR_API_KEY`      | Clé API Radarr                         |
| `SONARR_URL`          | URL de base Sonarr                     |
| `SONARR_API_KEY`      | Clé API Sonarr                         |
| `TAUTULLI_URL`        | URL de base Tautulli                   |
| `TAUTULLI_API_KEY`    | Clé API Tautulli                       |
| `PATH_MAPPINGS`       | Table de correspondance de chemins     |

La configuration persistante est stockée dans `/app/data/config.json`. Le montage `/host` est détecté automatiquement.
