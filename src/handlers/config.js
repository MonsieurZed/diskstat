/**
 * @file handlers/config.js
 * @description Gestionnaire de la route /api/config.
 *              Lecture et écriture de la configuration utilisateur persistante.
 *              Met à jour le cache Arr après chaque sauvegarde.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { readBody } = require("../bodyParser");

const CONFIG_PATH = process.env.CONFIG_PATH || "/app/data/config.json";

const DEFAULT_CONFIG = {
  language: "en",
  radarrUrl: "",
  radarrApiKey: "",
  radarrPublicUrl: "",
  sonarrUrl: "",
  sonarrApiKey: "",
  sonarrPublicUrl: "",
  tautulliUrl: "",
  tautulliApiKey: "",
  arrPathMap: "",
};

/**
 * Correspondance entre les clés de config et les variables d'environnement initiales.
 * Permet de détecter les champs pré-configurés via compose/env_file.
 * @type {Object.<string, string>}
 */
const ENV_MAP = {
  radarrUrl: "RADARR_URL",
  radarrApiKey: "RADARR_API_KEY",
  radarrPublicUrl: "RADARR_PUBLIC_URL",
  sonarrUrl: "SONARR_URL",
  sonarrApiKey: "SONARR_API_KEY",
  sonarrPublicUrl: "SONARR_PUBLIC_URL",
  tautulliUrl: "TAUTULLI_URL",
  tautulliApiKey: "TAUTULLI_API_KEY",
  arrPathMap: "ARR_PATH_MAP",
};

/**
 * Snapshot des variables d'environnement au démarrage, avant toute modification.
 * @type {Object.<string, string>}
 */
const envSnapshot = {};
for (const [cfgKey, envKey] of Object.entries(ENV_MAP)) {
  if (process.env[envKey]) envSnapshot[cfgKey] = process.env[envKey];
}

/**
 * Retourne la liste des champs verrouillés (définis via env vars au démarrage).
 * @returns {string[]} Clés de config verrouillées.
 */
function getLockedFields() {
  return Object.keys(envSnapshot);
}

/**
 * Charge la configuration depuis le fichier JSON.
 * @returns {Object} Configuration fusionnée avec les valeurs par défaut.
 */
function loadConfig() {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Sauvegarde la configuration dans le fichier JSON.
 * @param {Object} config - Configuration à persister.
 */
function saveConfig(config) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Applique la configuration utilisateur aux variables d'environnement.
 * @param {Object} config - Configuration chargée.
 */
function applyConfigToEnv(config) {
  if (config.radarrUrl) process.env.RADARR_URL = config.radarrUrl;
  if (config.radarrApiKey) process.env.RADARR_API_KEY = config.radarrApiKey;
  if (config.radarrPublicUrl) process.env.RADARR_PUBLIC_URL = config.radarrPublicUrl;
  if (config.sonarrUrl) process.env.SONARR_URL = config.sonarrUrl;
  if (config.sonarrApiKey) process.env.SONARR_API_KEY = config.sonarrApiKey;
  if (config.sonarrPublicUrl) process.env.SONARR_PUBLIC_URL = config.sonarrPublicUrl;
  if (config.tautulliUrl) process.env.TAUTULLI_URL = config.tautulliUrl;
  if (config.tautulliApiKey) process.env.TAUTULLI_API_KEY = config.tautulliApiKey;
  if (config.arrPathMap) process.env.ARR_PATH_MAP = config.arrPathMap;
}

/**
 * Gestionnaire GET /api/config — retourne la configuration courante.
 * @param {http.ServerResponse} res - Réponse HTTP.
 */
function handleGetConfig(res) {
  const config = loadConfig();
  const locked = getLockedFields();

  for (const field of locked) {
    config[field] = envSnapshot[field];
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ...config, locked }));
}

/**
 * Gestionnaire POST /api/config — sauvegarde la configuration et recharge le cache Arr.
 * @param {http.IncomingMessage} req - Requête HTTP.
 * @param {http.ServerResponse}  res - Réponse HTTP.
 */
async function handlePostConfig(req, res) {
  try {
    const body = await readBody(req);
    const config = { ...DEFAULT_CONFIG, ...body };
    saveConfig(config);
    applyConfigToEnv(config);

    const { refreshAll } = require("../arrCache");
    await refreshAll();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Effectue une requête HTTP GET et retourne le code de statut + body JSON.
 * @param {string} urlStr - URL de la requête.
 * @returns {Promise<{status: number, data: Object}>}
 */
function httpTestGet(urlStr) {
  return new Promise((resolve, reject) => {
    const req = http.get(urlStr, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

/**
 * Gestionnaire POST /api/test-connection — teste la connexion à un service Arr/Tautulli.
 * @param {http.IncomingMessage} req - Requête avec { service: 'radarr'|'sonarr'|'tautulli' }.
 * @param {http.ServerResponse}  res - Réponse HTTP.
 */
async function handleTestConnection(req, res) {
  try {
    const body = await readBody(req);
    const { service } = body;

    let testUrl;
    if (service === "radarr") {
      const url = process.env.RADARR_URL;
      const key = process.env.RADARR_API_KEY;
      if (!url || !key) throw new Error("Radarr URL or API key not configured");
      testUrl = `${url}/api/v3/system/status?apikey=${key}`;
    } else if (service === "sonarr") {
      const url = process.env.SONARR_URL;
      const key = process.env.SONARR_API_KEY;
      if (!url || !key) throw new Error("Sonarr URL or API key not configured");
      testUrl = `${url}/api/v3/system/status?apikey=${key}`;
    } else if (service === "tautulli") {
      const url = process.env.TAUTULLI_URL;
      const key = process.env.TAUTULLI_API_KEY;
      if (!url || !key) throw new Error("Tautulli URL or API key not configured");
      testUrl = `${url}/api/v2?apikey=${key}&cmd=server_info`;
    } else {
      throw new Error("Unknown service: " + service);
    }

    const result = await httpTestGet(testUrl);

    let ok = false;
    let version = "";
    if (service === "tautulli") {
      ok = result.status === 200 && result.data?.response?.result === "success";
      version = result.data?.response?.data?.pms_version || "";
    } else {
      ok = result.status === 200 && result.data?.version;
      version = result.data?.version || "";
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok, version }));
  } catch (err) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}

const initialConfig = loadConfig();
applyConfigToEnv(initialConfig);

module.exports = { handleGetConfig, handlePostConfig, handleTestConnection };
