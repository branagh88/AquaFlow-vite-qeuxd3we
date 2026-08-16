// ============================================================
// AQUAFLOW REMOTE GEMINI CLIENT  (classic script, no modules)
// Loaded from index.html BEFORE src/script.js.
//
// Tier 2 (online Gemini with Google Search Grounding). Exposes
// window.RemoteGemini:
//   - isConfigured()                 -> Promise<boolean>
//   - generateWithGrounding(query, context) -> Promise<string>
//
// Behavior contract (used by getAiReply in script.js):
//   - Returns '' on ANY error / timeout (~20s) so the field chat
//     never hangs and the orchestrator drops to Tier 3.
//   - Requires: online AND a runtime key.
//   - Key sources, in order:
//       1. Native-held key via AquaFlowGenAI.getRemoteApiKey()
//          (gradle property -> BuildConfig -> plugin). Production.
//       2. AQUAFLOW_CONFIG.geminiApiKey (web-dev, runtime-only).
//   - The key lives in a closure, is never persisted to
//     localStorage, never logged, and is sent via the
//     'x-goog-api-key' HTTP header (never in the URL).
//
// SECURITY: see security-hygiene skill. Never commit an API key.
// Production recommendation: a tiny proxy holds the key; the app
// calls the proxy instead of Google directly (see spec §7.4).
// ============================================================
(function () {
  'use strict';

  var root = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  var MODEL_ID = 'gemini-2.0-flash';
  var BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL_ID + ':generateContent';
  var TIMEOUT_MS = 20000; // field chat must never hang

  // Held in closure only - never persisted, never logged.
  var cachedKey = '';

  var SYSTEM_INSTRUCTION =
    'You are AquaFlow, a professional field-technician assistant for water well pumps, ' +
    'pressure tanks, VFDs (Grundfos CUE 100, Pentek Intellidrive) and Clack WS1 softener ' +
    'valves. Give concise, safe troubleshooting advice. Always lead with the highest-risk ' +
    'checks: dry-run protection, tank precharge, and electrical supply. When you use search ' +
    'grounding, cite the retrieved sources inline. Never invent part numbers or alarm codes. ' +
    'If a repair requires electrical work, remind the technician to disconnect power first.';

  function isOnline() {
    try {
      return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    } catch (e) {
      return true;
    }
  }

  async function resolveApiKey() {
    if (cachedKey) return cachedKey;
    var key = '';
    // 1) Native-held key (Capacitor plugin / BuildConfig).
    try {
      if (root.AquaFlowGenAI && typeof root.AquaFlowGenAI.getRemoteApiKey === 'function') {
        key = await root.AquaFlowGenAI.getRemoteApiKey();
      }
    } catch (e) { /* fall through */ }
    // 2) Web-dev runtime fallback (never committed).
    if (!key) {
      try {
        var cfg = root.AQUAFLOW_CONFIG || {};
        key = cfg.geminiApiKey || '';
      } catch (e) { /* fall through */ }
    }
    key = String(key || '').trim();
    if (key) cachedKey = key;
    return key;
  }

  // Online AND a runtime key is present.
  async function isConfigured() {
    if (!isOnline()) return false;
    var key = await resolveApiKey();
    return !!key;
  }

  function buildUserPrompt(query, context) {
    var parts = [];
    parts.push('Field technician query: ' + String(query || ''));
    if (context) {
      if (context.kbReply) {
        parts.push('Existing offline knowledge-base answer (use as base context):\n' + String(context.kbReply));
      }
      if (context.kbTree && context.kbTree.title) {
        var tree = context.kbTree;
        var startNode = tree.nodes && tree.nodes.start;
        var startText = '';
        if (startNode) {
          startText = startNode.question || '';
          if (Array.isArray(startNode.branches)) {
            startText += ' Branches: ' + startNode.branches.map(function (b) { return b.answer; }).join(', ');
          }
        }
        parts.push('Local diagnostic decision tree matched: ' + tree.title + (startText ? ' - ' + startText : ''));
      }
    }
    parts.push('Provide a focused, safe, actionable answer for a field technician.');
    return parts.join('\n\n');
  }

  // Returns the generated text or '' on any error / timeout.
  async function generateWithGrounding(query, context) {
    var key = await resolveApiKey();
    if (!key) return '';
    if (!isOnline()) return '';

    var payload = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(query, context) }] }],
      tools: [{ googleSearchRetrieval: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    };

    var controller = null;
    var timer = null;
    try {
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        timer = setTimeout(function () { try { controller.abort(); } catch (e) { /* ignore */ } }, TIMEOUT_MS);
      }
      var resp = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      });
      if (!resp.ok) return '';
      var data = await resp.json();
      if (!data || !Array.isArray(data.candidates) || !data.candidates.length) return '';
      var text = '';
      var parts = data.candidates[0].content && data.candidates[0].content.parts;
      if (Array.isArray(parts)) {
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] && typeof parts[i].text === 'string') text += parts[i].text;
        }
      }
      return String(text || '').trim();
    } catch (e) {
      return '';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  root.RemoteGemini = {
    modelId: MODEL_ID,
    isConfigured: isConfigured,
    generateWithGrounding: generateWithGrounding
  };
})();
