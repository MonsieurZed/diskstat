/**
 * @file js/state.js
 * @description Variables d'état global partagées entre les modules frontend.
 */

let currentData = null;
let navStack = [];
let hideLabels = false;
let lastScanDuration = 0;
const tooltip = document.getElementById('tooltip');
