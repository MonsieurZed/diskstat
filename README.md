# Explorerr

Analyseur d'utilisation disque avec interface web, rendu treemap squarified et mises à jour en temps réel via Server-Sent Events.

## Fonctionnalités

- Scan récursif configurable (profondeur 2–6)
- Visualisation treemap squarified interactive et récursive
- Progression en temps réel (SSE) avec reconnexion automatique
- Annulation de scan en cours
- **Tout afficher** : désactive le plafond de 200 entrées par nœud (remplace les `(N others)`)
- Masquer/afficher les fichiers cachés (`.nom`) — activé par défaut
- **Masquer labels** : cache les textes dans les blocs treemap sans re-scan
- Pourcentages `% vue` et `% total` dans la liste latérale et le tooltip
- Suppression et déplacement de fichiers depuis l'interface
- Mise à jour instantanée de l'arbre sans nouveau scan après actions
- Historique des scans (`localStorage`, 10 entrées max)
- Menu contextuel + modales (info, delete, move)
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
│       ├── treemap.js     — algorithme squarify + rendu
│       ├── fileList.js    — liste latérale + fil d'Ariane
│       ├── ui.js          — renderAll, patchTreeRemove
│       ├── scan.js        — flux SSE + annulation
│       ├── history.js     — historique localStorage
│       ├── fileOps.js     — menu contextuel + modales
│       └── events.js      — clavier, resize, init
└── src/
    ├── index.js
    ├── router.js
    ├── config.js
    ├── paths.js
    ├── bodyParser.js
    ├── sse.js
    ├── scanner.js
    ├── scanManager.js
    └── handlers/
        ├── scanStream.js
        ├── scanCancel.js
        └── fileOps.js
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

Centralisée dans `src/config.js`. Le montage `/host` est détecté automatiquement.
