/**
 * @file js/i18n.js
 * @description Système d'internationalisation. Supporte EN, FR et ES.
 *              Fournit la fonction t() pour traduire les clés.
 */

const TRANSLATIONS = {
  en: {
    scan: "Scan",
    hideHidden: "Hide hidden",
    hideLabels: "Hide labels",
    filesAndDirs: "Files & Directories",
    ready: "Ready - Enter a path and click Scan",
    scanning: "Scanning {path}...",
    scanningPct: "Scanning {path}... {pct}%",
    startingScan: "Starting scan...",
    reconnecting: "Reconnecting...",
    scanCancelled: "Scan cancelled.",
    cancelScan: "Cancel scan",
    copyPath: "Copy path",
    move: "Move",
    delete: "Delete",
    moreInfo: "More Info",
    openInRadarr: "Open in Radarr",
    openInSonarr: "Open in Sonarr",
    deleteTitle: "Delete",
    deleteConfirm: "Are you sure you want to delete this?",
    deleteWarning: "This action is permanent and cannot be undone.",
    deleting: "Deleting...",
    cancel: "Cancel",
    close: "Close",
    fileInfo: "File Information",
    moveTitle: "Move",
    moving: "Moving:",
    selectDest: "Select destination:",
    movingBtn: "Moving...",
    moveHere: "Move here",
    noSubdirs: "No subdirectories",
    loading: "Loading...",
    files: "files",
    folders: "folders",
    media: "media",
    clickToEnter: "Click to enter",
    ofCurrentView: "of current view",
    ofTotal: "of total",
    views: "view",
    viewsPlural: "views",
    settings: "Settings",
    settingsTitle: "Settings",
    language: "Language",
    radarrUrl: "Radarr URL",
    radarrKey: "Radarr API Key",
    radarrPublicUrl: "Radarr Public URL",
    sonarrUrl: "Sonarr URL",
    sonarrKey: "Sonarr API Key",
    sonarrPublicUrl: "Sonarr Public URL",
    tautulliUrl: "Tautulli URL",
    tautulliKey: "Tautulli API Key",
    pathMapping: "Path Mapping",
    pathMappingHint: "Format: /host/path:/arr/path (comma separated)",
    save: "Save",
    saved: "Saved!",
    integration: "Integration",
    general: "General",
    lockedByEnv: "Locked by environment variable",
    testConnection: "Test",
  },
  fr: {
    scan: "Scanner",
    hideHidden: "Masquer cachés",
    hideLabels: "Masquer labels",
    filesAndDirs: "Fichiers & Dossiers",
    ready: "Prêt - Entrez un chemin et cliquez Scanner",
    scanning: "Scan de {path}...",
    scanningPct: "Scan de {path}... {pct}%",
    startingScan: "Démarrage du scan...",
    reconnecting: "Reconnexion...",
    scanCancelled: "Scan annulé.",
    cancelScan: "Annuler le scan",
    copyPath: "Copier le chemin",
    move: "Déplacer",
    delete: "Supprimer",
    moreInfo: "Plus d'infos",
    openInRadarr: "Ouvrir dans Radarr",
    openInSonarr: "Ouvrir dans Sonarr",
    deleteTitle: "Suppression",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ceci ?",
    deleteWarning: "Cette action est permanente et irréversible.",
    deleting: "Suppression...",
    cancel: "Annuler",
    close: "Fermer",
    fileInfo: "Informations fichier",
    moveTitle: "Déplacer",
    moving: "Déplacement de :",
    selectDest: "Sélectionner la destination :",
    movingBtn: "Déplacement...",
    moveHere: "Déplacer ici",
    noSubdirs: "Aucun sous-dossier",
    loading: "Chargement...",
    files: "fichiers",
    folders: "dossiers",
    media: "media",
    clickToEnter: "Cliquer pour entrer",
    ofCurrentView: "de la vue actuelle",
    ofTotal: "du total",
    views: "visionnage",
    viewsPlural: "visionnages",
    settings: "Paramètres",
    settingsTitle: "Paramètres",
    language: "Langue",
    radarrUrl: "URL Radarr",
    radarrKey: "Clé API Radarr",
    radarrPublicUrl: "URL publique Radarr",
    sonarrUrl: "URL Sonarr",
    sonarrKey: "Clé API Sonarr",
    sonarrPublicUrl: "URL publique Sonarr",
    tautulliUrl: "URL Tautulli",
    tautulliKey: "Clé API Tautulli",
    pathMapping: "Mapping de chemins",
    pathMappingHint: "Format : /host/chemin:/arr/chemin (séparés par des virgules)",
    save: "Enregistrer",
    saved: "Enregistré !",
    integration: "Intégration",
    general: "Général",
    lockedByEnv: "Verrouillé par variable d'environnement",
    testConnection: "Tester",
  },
  es: {
    scan: "Escanear",
    hideHidden: "Ocultar ocultos",
    hideLabels: "Ocultar etiquetas",
    filesAndDirs: "Archivos y Carpetas",
    ready: "Listo - Ingrese una ruta y haga clic en Escanear",
    scanning: "Escaneando {path}...",
    scanningPct: "Escaneando {path}... {pct}%",
    startingScan: "Iniciando escaneo...",
    reconnecting: "Reconectando...",
    scanCancelled: "Escaneo cancelado.",
    cancelScan: "Cancelar escaneo",
    copyPath: "Copiar ruta",
    move: "Mover",
    delete: "Eliminar",
    moreInfo: "Más información",
    openInRadarr: "Abrir en Radarr",
    openInSonarr: "Abrir en Sonarr",
    deleteTitle: "Eliminar",
    deleteConfirm: "¿Está seguro de que desea eliminar esto?",
    deleteWarning: "Esta acción es permanente e irreversible.",
    deleting: "Eliminando...",
    cancel: "Cancelar",
    close: "Cerrar",
    fileInfo: "Información del archivo",
    moveTitle: "Mover",
    moving: "Moviendo:",
    selectDest: "Seleccionar destino:",
    movingBtn: "Moviendo...",
    moveHere: "Mover aquí",
    noSubdirs: "Sin subdirectorios",
    loading: "Cargando...",
    files: "archivos",
    folders: "carpetas",
    media: "media",
    clickToEnter: "Clic para entrar",
    ofCurrentView: "de la vista actual",
    ofTotal: "del total",
    views: "visualización",
    viewsPlural: "visualizaciones",
    settings: "Configuración",
    settingsTitle: "Configuración",
    language: "Idioma",
    radarrUrl: "URL Radarr",
    radarrKey: "Clave API Radarr",
    radarrPublicUrl: "URL pública Radarr",
    sonarrUrl: "URL Sonarr",
    sonarrKey: "Clave API Sonarr",
    sonarrPublicUrl: "URL pública Sonarr",
    tautulliUrl: "URL Tautulli",
    tautulliKey: "Clave API Tautulli",
    pathMapping: "Mapeo de rutas",
    pathMappingHint: "Formato: /host/ruta:/arr/ruta (separados por comas)",
    save: "Guardar",
    saved: "¡Guardado!",
    integration: "Integración",
    general: "General",
    lockedByEnv: "Bloqueado por variable de entorno",
    testConnection: "Probar",
  },
};

let currentLang = localStorage.getItem("explorerr_lang") || "en";

/**
 * Retourne la traduction d'une clé dans la langue courante.
 * @param {string} key    - Clé de traduction.
 * @param {Object} [vars] - Variables de substitution {clé: valeur}.
 * @returns {string} Texte traduit.
 */
function t(key, vars) {
  let text = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.en[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

/**
 * Change la langue courante et met à jour l'interface.
 * @param {string} lang - Code langue (en, fr, es).
 */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("explorerr_lang", lang);
  applyTranslations();
}

/**
 * Applique les traductions à tous les éléments portant l'attribut data-i18n.
 */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (el.tagName === "INPUT" && el.type !== "checkbox") {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });

  if (currentData) updateStatus(currentData);
}
