/**
 * @file js/format.js
 * @description Fonctions de formatage : tailles, couleurs et durées.
 */

function getColor(node, depth) {
  if (node.children && node.children.length > 0) {
    return DIR_COLORS[depth % DIR_COLORS.length];
  }
  const ext = (node.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  return EXT_COLORS[ext] || '#565f89';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function formatTime(secs) {
  if (secs === null || secs === undefined) return '--:--';
  if (secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
