/**
 * @file js/scan.js
 * @description Flux SSE de scan : démarrage, reconnexion, annulation et
 *              gestion des messages de progression en temps réel.
 */

let elapsedTimer = null;
let activeScanId = null;
let activeEvtSource = null;
let isCancelling = false;
let activeScanReject = null;

function showScanUI(scanPath) {
  document.getElementById("scanBtn").disabled = true;
  document.getElementById("loading").style.display = "flex";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("progressPct").textContent = "0%";
  document.getElementById("progressElapsed").textContent = "0:00";
  document.getElementById("progressPath").textContent = t("startingScan");
  document.getElementById("statusLeft").textContent = t("scanning", { path: scanPath });
}

function hideScanUI() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
  document.getElementById("scanBtn").disabled = false;
  document.getElementById("loading").style.display = "none";
  activeScanId = null;
  activeEvtSource = null;
  activeScanReject = null;
  isCancelling = false;
  sessionStorage.removeItem("explorerr_active_scan");
}

async function cancelScan() {
  if (!activeScanId && !activeEvtSource) return;
  const cancelId = activeScanId;
  isCancelling = true;
  if (activeEvtSource) {
    activeEvtSource.close();
    activeEvtSource = null;
  }
  if (activeScanReject) {
    activeScanReject(new Error("cancelled"));
    activeScanReject = null;
  }
  if (cancelId) {
    fetch("/api/scan/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cancelId }),
    }).catch(() => {});
  }
}

function connectToScan(sseUrl, scanPath, depth) {
  return new Promise((resolve, reject) => {
    activeScanReject = reject;
    const evtSource = new EventSource(sseUrl);
    activeEvtSource = evtSource;

    evtSource.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "scan-id") {
        activeScanId = msg.id;
        sessionStorage.setItem(
          "explorerr_active_scan",
          JSON.stringify({
            id: msg.id,
            path: msg.path,
            depth,
            startTime: Date.now(),
          }),
        );
      }

      if (msg.type === "progress") {
        const pct = msg.pct ?? 0;
        const total = msg.topLevelTotal || 0;
        const done = msg.topLevelDone || 0;
        document.getElementById("progressBar").style.width = pct + "%";
        document.getElementById("progressPct").textContent = pct + "%";
        document.getElementById("progressPath").textContent = msg.currentPath || "";
        const detail = total > 0 ? ` (${done}/${total})` : "";
        document.getElementById("statusLeft").textContent = t("scanningPct", { path: scanPath, pct }) + detail;
      }

      if (msg.type === "done") {
        evtSource.close();
        activeEvtSource = null;
        sessionStorage.removeItem("explorerr_active_scan");
        resolve(msg.data);
      }

      if (msg.type === "cancelled") {
        evtSource.close();
        activeEvtSource = null;
        sessionStorage.removeItem("explorerr_active_scan");
        reject(new Error("cancelled"));
      }

      if (msg.type === "error") {
        evtSource.close();
        activeEvtSource = null;
        sessionStorage.removeItem("explorerr_active_scan");
        reject(new Error(msg.error));
      }

      if (msg.type === "expired") {
        evtSource.close();
        activeEvtSource = null;
        sessionStorage.removeItem("explorerr_active_scan");
        reject(new Error("expired"));
      }
    };

    evtSource.onerror = () => {
      evtSource.close();
      activeEvtSource = null;
      if (isCancelling) {
        reject(new Error("cancelled"));
        return;
      }
      if (activeScanId) {
        document.getElementById("progressPath").textContent = t("reconnecting");
        setTimeout(() => {
          connectToScan(`/api/scan-stream?id=${activeScanId}`, scanPath, depth).then(resolve).catch(reject);
        }, 2000);
      } else {
        reject(new Error("Connection lost"));
      }
    };
  });
}

async function startScan() {
  const scanPath = document.getElementById("pathInput").value.trim() || "/";
  const depth = document.getElementById("depthSelect").value;
  const hideHidden = document.getElementById("hideHiddenToggle").checked ? "1" : "0";
  const showAll = "1";

  showScanUI(scanPath);

  const scanStart = Date.now();
  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - scanStart) / 1000);
    document.getElementById("progressElapsed").textContent = formatTime(elapsed);
  }, 1000);

  try {
    const sseUrl = `/api/scan-stream?path=${encodeURIComponent(scanPath)}&depth=${depth}&hideHidden=${hideHidden}&showAll=${showAll}`;
    const data = await connectToScan(sseUrl, scanPath, depth);
    if (data.error) {
      alert("Error: " + data.error);
      return;
    }
    localStorage.setItem("explorerr_last_path", scanPath);
    lastScanDuration = Date.now() - scanStart;
    currentData = data;
    navStack = [];
    renderAll(data);
  } catch (err) {
    if (err.message === "cancelled") {
      document.getElementById("statusLeft").textContent = t("scanCancelled");
    } else if (err.message !== "expired") {
      alert("Scan failed: " + err.message);
    }
  } finally {
    hideScanUI();
  }
}

async function reconnectToScan(savedScan) {
  const { id, path: scanPath, depth, startTime } = savedScan;

  showScanUI(scanPath);
  document.getElementById("pathInput").value = scanPath;
  document.getElementById("progressPath").textContent = t("reconnecting");

  if (elapsedTimer) clearInterval(elapsedTimer);
  elapsedTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    document.getElementById("progressElapsed").textContent = formatTime(elapsed);
  }, 1000);

  activeScanId = id;

  try {
    const data = await connectToScan(`/api/scan-stream?id=${id}`, scanPath, depth);
    if (data.error) {
      alert("Error: " + data.error);
      return;
    }
    currentData = data;
    navStack = [];
    renderAll(data);
  } catch (err) {
    if (err.message === "cancelled") {
      document.getElementById("statusLeft").textContent = t("scanCancelled");
    } else if (err.message === "expired") {
      sessionStorage.removeItem("explorerr_active_scan");
    } else {
      alert("Scan failed: " + err.message);
    }
  } finally {
    hideScanUI();
  }
}
