// ============================================================
// AQUAFLOW GEN AI BRIDGE  (classic script, no modules)
// Loaded from index.html BEFORE src/script.js.
//
// Tier 1 (Gemini Nano on-device via ML Kit GenAI) + Tier 2 key
// access. Exposes window.AquaFlowGenAI:
//   - isNanoAvailable()  -> { available, reason }
//   - getModelStatus()   -> { status, progress }
//   - downloadModel()    -> triggers native download w/ progress
//   - generateContent()  -> { text } ('' on failure)
//   - getRemoteApiKey()  -> { apiKey } (native-held Tier-2 key,
//                           '' when not configured)
//   - generateRemoteContent() -> optional native-side Tier-2 REST
//
// When the native Capacitor plugin is absent (plain browser /
// desktop web), every method degrades to an explicit
// "unavailable" stub so the orchestrator in script.js drops
// through to Tier 2 / Tier 3 automatically.
//
// SECURITY: this file never contains, logs, or persists an API
// key. The Tier-2 key is held natively (gradle property ->
// BuildConfig -> plugin -> runtime JS closure) or injected at
// runtime only via AQUAFLOW_CONFIG.geminiApiKey for web-dev
// testing. See security-hygiene skill; never commit a key.
// ============================================================
(function () {
  'use strict';

  var root = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  var PLUGIN_NAME = 'AquaFlowGenAI';
  var MODEL_NAME = 'gemini-nano';

  function getNativePlugin() {
    try {
      if (root.Capacitor && root.Capacitor.Plugins && root.Capacitor.Plugins[PLUGIN_NAME]) {
        return root.Capacitor.Plugins[PLUGIN_NAME];
      }
    } catch (e) { /* bridge not ready */ }
    return null;
  }

  function unavailableResult(reason) {
    return { available: false, reason: reason || 'unsupported-platform' };
  }

  // --- Tier 1: Gemini Nano -----------------------------------
  async function isNanoAvailable() {
    var native = getNativePlugin();
    if (native && typeof native.isNanoAvailable === 'function') {
      try {
        var res = await native.isNanoAvailable();
        return { available: !!(res && res.available), reason: (res && res.reason) || 'ok' };
      } catch (e) {
        return { available: false, reason: 'plugin-error' };
      }
    }
    return unavailableResult('unsupported-platform');
  }

  // status: unknown | notDownloaded | downloading | downloaded
  async function getModelStatus() {
    var native = getNativePlugin();
    if (native && typeof native.getModelStatus === 'function') {
      try {
        var res = await native.getModelStatus();
        return {
          status: (res && res.status) || 'unknown',
          progress: (res && typeof res.progress === 'number') ? res.progress : 0
        };
      } catch (e) {
        return { status: 'unknown', progress: 0 };
      }
    }
    return { status: 'unavailable', progress: 0 };
  }

  // Returns { status } and reports 'download-progress' events.
  async function downloadModel() {
    var native = getNativePlugin();
    if (native && typeof native.downloadModel === 'function') {
      try {
        var res = await native.downloadModel();
        return { status: (res && res.status) || 'downloading', progress: (res && typeof res.progress === 'number') ? res.progress : 0 };
      } catch (e) {
        return { status: 'notDownloaded', progress: 0 };
      }
    }
    return { status: 'unavailable', progress: 0 };
  }

  // Returns the generated text, or '' on any failure so the
  // orchestrator drops to Tier 2/3 automatically.
  async function generateContent(prompt) {
    var native = getNativePlugin();
    if (native && typeof native.generateContent === 'function') {
      try {
        var res = await native.generateContent({ prompt: String(prompt || '') });
        if (res && typeof res.text === 'string' && res.text.trim()) return res.text;
        return '';
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  // --- Tier 2: remote key access -----------------------------
  // Returns the native-held key ('' when not configured). Held in
  // a closure by callers; never persisted to localStorage.
  async function getRemoteApiKey() {
    var native = getNativePlugin();
    if (native && typeof native.getRemoteApiKey === 'function') {
      try {
        var res = await native.getRemoteApiKey();
        return (res && typeof res.apiKey === 'string') ? res.apiKey : '';
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  // Optional native-side Tier-2 REST call (recommended production
  // path: keeps the key off the wire from the webview). Returns
  // { text } or { text: '' } on any failure. When the native path
  // is unavailable it returns '' so remote-gemini.js falls back to
  // its own fetch-based client.
  async function generateRemoteContent(prompt, tools) {
    var native = getNativePlugin();
    if (native && typeof native.generateRemoteContent === 'function') {
      try {
        var res = await native.generateRemoteContent({ prompt: String(prompt || ''), tools: tools || [] });
        if (res && typeof res.text === 'string' && res.text.trim()) return res.text;
        return '';
      } catch (e) {
        return '';
      }
    }
    return '';
  }

  root.AquaFlowGenAI = {
    modelName: MODEL_NAME,
    isNanoAvailable: isNanoAvailable,
    getModelStatus: getModelStatus,
    downloadModel: downloadModel,
    generateContent: generateContent,
    getRemoteApiKey: getRemoteApiKey,
    generateRemoteContent: generateRemoteContent
  };
})();
