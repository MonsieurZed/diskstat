/**
 * @file js/config.js
 * @description Constantes de couleur par extension de fichier et par profondeur de répertoire.
 */

const EXT_COLORS = {
  // Video
  '.mkv': '#e06c75', '.mp4': '#e06c75', '.avi': '#d94f5f', '.mov': '#c94555',
  '.wmv': '#b93b4b', '.flv': '#e06c75', '.webm': '#e06c75', '.m4v': '#e06c75',
  '.ts': '#d94f5f',
  // Audio
  '.mp3': '#e0af68', '.flac': '#d4a35c', '.wav': '#c89750', '.aac': '#e0af68',
  '.ogg': '#e0af68', '.m4a': '#e0af68', '.opus': '#d4a35c', '.wma': '#c89750',
  // Images
  '.jpg': '#9ece6a', '.jpeg': '#9ece6a', '.png': '#92c25e', '.gif': '#86b652',
  '.bmp': '#7aaa46', '.svg': '#9ece6a', '.webp': '#9ece6a', '.tiff': '#86b652',
  '.ico': '#7aaa46', '.raw': '#6e9e3a',
  // Archives
  '.zip': '#bb9af7', '.rar': '#b18ef1', '.7z': '#a782eb', '.tar': '#9d76e5',
  '.gz': '#936adf', '.bz2': '#895ed9', '.xz': '#bb9af7', '.zst': '#b18ef1',
  // Documents
  '.pdf': '#f7768e', '.doc': '#7aa2f7', '.docx': '#7aa2f7', '.xls': '#9ece6a',
  '.xlsx': '#9ece6a', '.ppt': '#ff9e64', '.pptx': '#ff9e64', '.txt': '#a9b1d6',
  '.md': '#a9b1d6', '.csv': '#9ece6a',
  // Code
  '.js': '#e0af68', '.py': '#7aa2f7', '.java': '#f7768e', '.cpp': '#7aa2f7',
  '.c': '#7aa2f7', '.go': '#7dcfff', '.rs': '#ff9e64', '.rb': '#f7768e',
  '.php': '#bb9af7', '.html': '#ff9e64', '.css': '#7aa2f7', '.json': '#e0af68',
  '.xml': '#ff9e64', '.yml': '#f7768e', '.yaml': '#f7768e', '.sh': '#9ece6a',
  // Database
  '.db': '#7dcfff', '.sqlite': '#7dcfff', '.sql': '#7dcfff',
  // Disk images / ISOs
  '.iso': '#ff9e64', '.img': '#ff9e64',
  // Executables
  '.exe': '#f7768e', '.dll': '#f7768e', '.so': '#f7768e', '.bin': '#d94f5f',
  // Misc
  '.log': '#565f89', '.bak': '#565f89', '.tmp': '#565f89',
};

const DIR_COLORS = [
  '#5a7fbf', '#4e8f6a', '#8f6a4e', '#6a4e8f', '#8f4e6a',
  '#4e6a8f', '#6a8f4e', '#8f8f4e', '#4e8f8f', '#8f4e4e',
];
