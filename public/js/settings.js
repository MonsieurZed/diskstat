/**
 * @file js/settings.js
 * @description Chargement et sauvegarde de la configuration utilisateur
 *              via l'API /api/config. Gestion de la modal Settings,
 *              verrouillage des champs env et test de connexion.
 */

/**
 * Charge la configuration serveur et remplit les champs de la modal.
 * Verrouille les champs définis via variables d'environnement.
 */
async function loadSettings() {
  try {
    const resp = await fetch('/api/config');
    const cfg  = await resp.json();

    document.getElementById('cfgLang').value           = cfg.language || 'en';
    document.getElementById('cfgRadarrUrl').value       = cfg.radarrUrl || '';
    document.getElementById('cfgRadarrKey').value       = cfg.radarrApiKey || '';
    document.getElementById('cfgRadarrPublicUrl').value = cfg.radarrPublicUrl || '';
    document.getElementById('cfgSonarrUrl').value       = cfg.sonarrUrl || '';
    document.getElementById('cfgSonarrKey').value       = cfg.sonarrApiKey || '';
    document.getElementById('cfgSonarrPublicUrl').value = cfg.sonarrPublicUrl || '';
    document.getElementById('cfgTautulliUrl').value     = cfg.tautulliUrl || '';
    document.getElementById('cfgTautulliKey').value     = cfg.tautulliApiKey || '';
    document.getElementById('cfgPathMap').value         = cfg.arrPathMap || '';

    const locked = cfg.locked || [];
    const fieldMap = {
      radarrUrl:       'cfgRadarrUrl',
      radarrApiKey:    'cfgRadarrKey',
      radarrPublicUrl: 'cfgRadarrPublicUrl',
      sonarrUrl:       'cfgSonarrUrl',
      sonarrApiKey:    'cfgSonarrKey',
      sonarrPublicUrl: 'cfgSonarrPublicUrl',
      tautulliUrl:     'cfgTautulliUrl',
      tautulliApiKey:  'cfgTautulliKey',
      arrPathMap:      'cfgPathMap',
    };

    for (const [cfgKey, elId] of Object.entries(fieldMap)) {
      const el = document.getElementById(elId);
      if (locked.includes(cfgKey)) {
        el.disabled = true;
        el.classList.add('settings-locked');
        el.title = t('lockedByEnv');
      } else {
        el.disabled = false;
        el.classList.remove('settings-locked');
        el.title = '';
      }
    }

    if (cfg.language && cfg.language !== currentLang) {
      setLanguage(cfg.language);
    }
  } catch {}
}

/**
 * Sauvegarde la configuration vers le serveur et applique la langue.
 */
async function saveSettings() {
  const btn = document.getElementById('settingsSaveBtn');
  const cfg = {
    language:        document.getElementById('cfgLang').value,
    radarrUrl:       document.getElementById('cfgRadarrUrl').value.trim(),
    radarrApiKey:    document.getElementById('cfgRadarrKey').value.trim(),
    radarrPublicUrl: document.getElementById('cfgRadarrPublicUrl').value.trim(),
    sonarrUrl:       document.getElementById('cfgSonarrUrl').value.trim(),
    sonarrApiKey:    document.getElementById('cfgSonarrKey').value.trim(),
    sonarrPublicUrl: document.getElementById('cfgSonarrPublicUrl').value.trim(),
    tautulliUrl:     document.getElementById('cfgTautulliUrl').value.trim(),
    tautulliApiKey:  document.getElementById('cfgTautulliKey').value.trim(),
    arrPathMap:      document.getElementById('cfgPathMap').value.trim(),
  };

  btn.disabled    = true;
  btn.textContent = '...';

  try {
    await fetch('/api/config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(cfg),
    });

    setLanguage(cfg.language);
    btn.textContent = t('saved');
    setTimeout(() => {
      btn.disabled    = false;
      btn.textContent = t('save');
    }, 1500);
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled    = false;
    btn.textContent = t('save');
  }
}

/**
 * Teste la connexion à un service Arr/Tautulli.
 * @param {string} service - Identifiant du service ('radarr', 'sonarr', 'tautulli').
 */
async function testConnection(service) {
  const btnId = 'test' + service.charAt(0).toUpperCase() + service.slice(1) + 'Btn';
  const btn   = document.getElementById(btnId);
  const originalText = btn.textContent;

  btn.disabled    = true;
  btn.textContent = '...';
  btn.className   = 'settings-test-btn';

  try {
    const resp = await fetch('/api/test-connection', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ service }),
    });
    const result = await resp.json();

    if (result.ok) {
      btn.textContent = result.version ? '\u2713 v' + result.version : '\u2713 OK';
      btn.classList.add('test-ok');
    } else {
      btn.textContent = '\u2717 ' + (result.error || 'Failed');
      btn.classList.add('test-fail');
    }
  } catch (err) {
    btn.textContent = '\u2717 ' + err.message;
    btn.classList.add('test-fail');
  }

  setTimeout(() => {
    btn.disabled    = false;
    btn.textContent = originalText;
    btn.className   = 'settings-test-btn';
  }, 3000);
}

document.getElementById('settingsSaveBtn').addEventListener('click', saveSettings);

loadSettings();
