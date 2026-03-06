/**
 * @file js/scan.js
 * @description Flux SSE de scan : démarrage, reconnexion, annulation et
 *              gestion des messages de progression en temps réel.
 */

let elapsedTimer  = null;
let activeScanId  = null;
let activeEvtSource = null;
let isCancelling  = false;

function showScanUI(scanPath) {
  document.getElementById('scanBtn').disabled = true;
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('progressBar').style.width  = '0%';
  document.getElementById('progressPct').textContent  = '0%';
  document.getElementById('progressElapsed').textContent = '0:00';
  document.getElementById('progressPath').textContent = 'Starting scan...';
  document.getElementById('statusLeft').textContent   = `Scanning ${scanPath}...`;
}

function hideScanUI() {
  if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  document.getElementById('scanBtn').disabled = false;
  document.getElementById('loading').style.display = 'none';
  activeScanId  = null;
  activeEvtSource = null;
  isCancelling  = false;
  sessionStorage.removeItem('dirstat_active_scan');
}

async function cancelScan() {
  if (!activeScanId) return;
  isCancelling = true;
  if (activeEvtSource) { activeEvtSource.close(); activeEvtSource = null; }
  try {
    await fetch('/api/scan/cancel', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: activeScanId }),
    });
  } catch {}
  document.getElementById('statusLeft').textContent = 'Scan annulé.';
  hideScanUI();
}

function connectToScan(sseUrl, scanPath, depth) {
  return new Promise((resolve, reject) => {
    const evtSource = new EventSource(sseUrl);
    activeEvtSource = evtSource;

    evtSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'scan-id') {
        activeScanId = msg.id;
        sessionStorage.setItem('dirstat_active_scan', JSON.stringify({
          id: msg.id, path: msg.path, depth, startTime: Date.now(),
        }));
      }

      if (msg.type === 'progress') {
        document.getElementById('progressBar').style.width   = (msg.pct || 0) + '%';
        document.getElementById('progressPct').textContent   = (msg.pct || 0) + '%';
        document.getElementById('progressPath').textContent  = msg.currentPath || '';
        document.getElementById('statusLeft').textContent    = `Scanning ${scanPath}... ${msg.pct || 0}%`;
      }

      if (msg.type === 'done') {
        evtSource.close(); activeEvtSource = null;
        sessionStorage.removeItem('dirstat_active_scan');
        resolve(msg.data);
      }

      if (msg.type === 'cancelled') {
        evtSource.close(); activeEvtSource = null;
        sessionStorage.removeItem('dirstat_active_scan');
        reject(new Error('cancelled'));
      }

      if (msg.type === 'error') {
        evtSource.close(); activeEvtSource = null;
        sessionStorage.removeItem('dirstat_active_scan');
        reject(new Error(msg.error));
      }

      if (msg.type === 'expired') {
        evtSource.close(); activeEvtSource = null;
        sessionStorage.removeItem('dirstat_active_scan');
        reject(new Error('expired'));
      }
    };

    evtSource.onerror = () => {
      evtSource.close(); activeEvtSource = null;
      if (isCancelling) { reject(new Error('cancelled')); return; }
      if (activeScanId) {
        document.getElementById('progressPath').textContent = 'Reconnecting...';
        setTimeout(() => {
          connectToScan(`/api/scan-stream?id=${activeScanId}`, scanPath, depth)
            .then(resolve).catch(reject);
        }, 2000);
      } else {
        reject(new Error('Connection lost'));
      }
    };
  });
}

async function startScan() {
  const scanPath   = document.getElementById('pathInput').value.trim() || '/';
  const depth      = document.getElementById('depthSelect').value;
  const hideHidden = document.getElementById('hideHiddenToggle').checked ? '1' : '0';
  const showAll    = document.getElementById('showAllToggle').checked    ? '1' : '0';

  showScanUI(scanPath);

  const scanStart = Date.now();
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - scanStart) / 1000);
    document.getElementById('progressElapsed').textContent = formatTime(elapsed);
  }, 1000);

  try {
    const sseUrl = `/api/scan-stream?path=${encodeURIComponent(scanPath)}&depth=${depth}&hideHidden=${hideHidden}&showAll=${showAll}`;
    const data   = await connectToScan(sseUrl, scanPath, depth);
    if (data.error) { alert('Error: ' + data.error); return; }
    currentData = data;
    navStack    = [];
    renderAll(data);
    saveScanToHistory(scanPath, depth, data);
  } catch (err) {
    if (err.message !== 'expired' && err.message !== 'cancelled') {
      alert('Scan failed: ' + err.message);
    }
  } finally {
    hideScanUI();
  }
}

async function reconnectToScan(savedScan) {
  const { id, path: scanPath, depth, startTime } = savedScan;

  showScanUI(scanPath);
  document.getElementById('pathInput').value       = scanPath;
  document.getElementById('progressPath').textContent = 'Reconnecting to scan...';

  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    document.getElementById('progressElapsed').textContent = formatTime(elapsed);
  }, 1000);

  activeScanId = id;

  try {
    const data = await connectToScan(`/api/scan-stream?id=${id}`, scanPath, depth);
    if (data.error) { alert('Error: ' + data.error); return; }
    currentData = data;
    navStack    = [];
    renderAll(data);
    saveScanToHistory(scanPath, depth, data);
  } catch (err) {
    if (err.message === 'expired') {
      sessionStorage.removeItem('dirstat_active_scan');
    } else if (err.message !== 'cancelled') {
      alert('Scan failed: ' + err.message);
    }
  } finally {
    hideScanUI();
  }
}
