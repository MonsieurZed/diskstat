# 2026-03-06 14:00 — Initialisation projet DiskStat — TERMINÉ

## Mission

Transformer le prototype monolithique `server.js` + `index.html` en un projet
modulaire, documenté, versionné sur GitHub et déployé en production sous
`diskstat.zed.cx`.

---

## Actions réalisées

### Infrastructure
- Fermeture des ports inutiles (SnappyMail 6666/7777, Tdarr 8265/8266, Dirstat 8070)
- Correction du crash SWAG : directive `proxy_read_timeout` dupliquée dans
  `diskstat.dev.subdomain.conf` → suppression du doublon, rechargement nginx

### Fonctionnalités ajoutées au prototype
- **Annulation de scan** : route `POST /api/scan/cancel`, bouton overlay, flag `isCancelling`
- **Volume restreint** : montage Docker `/home/monsieurz:/host` (au lieu de `/:/host`)
- **Masquer fichiers cachés** : toggle `hideHidden` (activé par défaut), propagé au Worker
- **Mise à jour sans rescan** : `patchTreeRemove()` met à jour l'arbre en mémoire après delete/move
- **Pourcentages** : `0.00% vue` et `0.00% total` dans la liste latérale et le tooltip
- **Tout afficher** : toggle `showAll`, supprime le plafond de 200 nœuds par répertoire
- **Masquer labels** : toggle CSS `no-labels` sur `#treemap`, sans re-render
- **Logo SVG** : 5 rectangles colorés (treemap) dans le header

### Modularisation backend (`src/`)
| Fichier               | Responsabilité                                 |
|-----------------------|------------------------------------------------|
| index.js              | Entrée HTTP                                    |
| router.js             | Aiguillage routes + statiques                  |
| config.js             | Constantes globales                            |
| paths.js              | Conversion chemins hôte ↔ conteneur           |
| bodyParser.js         | Lecture corps JSON                             |
| sse.js                | Gestion connexions SSE                         |
| scanner.js            | Scan récursif + Worker thread                  |
| scanManager.js        | Cycle de vie des scans (Map + Worker)          |
| handlers/scanStream.js | GET /api/scan-stream                          |
| handlers/scanCancel.js | POST /api/scan/cancel                         |
| handlers/fileOps.js   | delete, move, list, info, du, scans            |

### Modularisation frontend (`public/`)
| Fichier          | Responsabilité                             |
|------------------|--------------------------------------------|
| css/main.css     | Tous les styles (Tokyo Night)              |
| js/config.js     | EXT_COLORS, DIR_COLORS                     |
| js/format.js     | formatSize, getColor, formatTime           |
| js/state.js      | Variables d'état global                    |
| js/treemap.js    | squarify + renderTreemap + attachTooltip   |
| js/fileList.js   | renderFileList, renderBreadcrumb, legend   |
| js/ui.js         | renderAll, updateStatus, patchTreeRemove   |
| js/scan.js       | Flux SSE complet                           |
| js/history.js    | Historique localStorage                    |
| js/fileOps.js    | Menu contextuel + 3 modales                |
| js/events.js     | Clavier, resize, init                      |

### Corrections de bugs
- `router.js` : chemin `../../public` → `../public` (résolvait vers `/public` inexistant)

### Git & Déploiement
- Repo créé : https://github.com/MonsieurZed/diskstat
- Release : v1.0.0
- Stack production `/home/monsieurz/stack/diskstat/` → port 8071 → `diskstat.zed.cx`
- Conf SWAG : `diskstat.subdomain.conf` (proxy SSE, timeouts 3600s)

---

## État final

- `diskstat-dev` : port 8070 — actif ✅
- `diskstat` (prod) : port 8071 — actif ✅
- SWAG : nginx opérationnel ✅
- GitHub : https://github.com/MonsieurZed/diskstat — branch `main` ✅
