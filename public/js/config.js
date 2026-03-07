/**
 * @file js/config.js
 * @description Constantes de couleur par extension de fichier et par profondeur de répertoire.
 */

const EXT_COLORS = {
  // Video
  '.mkv': '#8c5a5f', '.mp4': '#8c5a5f', '.avi': '#845458', '.mov': '#7c4e52',
  '.wmv': '#74484c', '.flv': '#8c5a5f', '.webm': '#8c5a5f', '.m4v': '#8c5a5f',
  '.ts': '#845458',
  // Audio
  '.mp3': '#9e8a52', '.flac': '#968250', '.wav': '#8e7a4e', '.aac': '#9e8a52',
  '.ogg': '#9e8a52', '.m4a': '#9e8a52', '.opus': '#968250', '.wma': '#8e7a4e',
  // Images
  '.jpg': '#6a8c52', '.jpeg': '#6a8c52', '.png': '#648650', '.gif': '#5e804e',
  '.bmp': '#587a4c', '.svg': '#6a8c52', '.webp': '#6a8c52', '.tiff': '#5e804e',
  '.ico': '#587a4c', '.raw': '#527448',
  // Archives
  '.zip': '#7a6a9e', '.rar': '#746496', '.7z': '#6e5e8e', '.tar': '#685886',
  '.gz': '#62527e', '.bz2': '#5c4c76', '.xz': '#7a6a9e', '.zst': '#746496',
  // Documents
  '.pdf': '#9e5a6a', '.doc': '#5a7a9e', '.docx': '#5a7a9e', '.xls': '#6a8c52',
  '.xlsx': '#6a8c52', '.ppt': '#9e7a52', '.pptx': '#9e7a52', '.txt': '#7a8296',
  '.md': '#7a8296', '.csv': '#6a8c52',
  // Code
  '.js': '#9e8a52', '.py': '#5a7a9e', '.java': '#9e5a6a', '.cpp': '#5a7a9e',
  '.c': '#5a7a9e', '.go': '#5a8e9e', '.rs': '#9e7a52', '.rb': '#9e5a6a',
  '.php': '#7a6a9e', '.html': '#9e7a52', '.css': '#5a7a9e', '.json': '#9e8a52',
  '.xml': '#9e7a52', '.yml': '#9e5a6a', '.yaml': '#9e5a6a', '.sh': '#6a8c52',
  // Database
  '.db': '#5a8e9e', '.sqlite': '#5a8e9e', '.sql': '#5a8e9e',
  // Disk images / ISOs
  '.iso': '#9e7a52', '.img': '#9e7a52',
  // Executables
  '.exe': '#9e5a6a', '.dll': '#9e5a6a', '.so': '#9e5a6a', '.bin': '#8c4e5a',
  // Misc
  '.log': '#4a5268', '.bak': '#4a5268', '.tmp': '#4a5268',
};

const DIR_COLORS = [
  '#3a4f6a', '#4a6a4a', '#5a4a6a', '#6a5a3a', '#3a5a5a',
  '#5a3a4a', '#4a5a3a', '#3a4a5a', '#5a4a3a', '#4a3a5a',
];

const VIDEO_EXTS = new Set([
  '.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts',
]);

/**
 * Vérifie si un fichier est une vidéo d'après son extension.
 * @param {string} name - Nom du fichier.
 * @returns {boolean} Vrai si le fichier est une vidéo.
 */
function isVideoFile(name) {
  const ext = (name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  return VIDEO_EXTS.has(ext);
}
