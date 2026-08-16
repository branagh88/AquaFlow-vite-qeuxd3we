# AquaFlow AI Diagnostics — Hybrid Inference / Fallback Rebuild

Plan + phase breakdown ONLY. No code changes in this document.

## 1. Goal

Rebuild AquaFlow's AI Diagnostics module (chat + enrichment) from the current
"offline KB + experimental Transformers.js CDN model" arrangement into a
**3-tier Hybrid Inference / Fallback ladder** that is offline-first and field-safe:

1. **TIER 1 — Android on-device Gemini Nano** via ML Kit GenAI
   (`com.google.mlkit:genai-inference`), exposed through a custom Capacitor
   plugin (`isNanoAvailable()`, `getModelStatus()`, `downloadModel()`,
   `generateContent()`) with web stubs reporting `unavailable`.
2. **TIER 2 — Online remote Gemini API with Google Search Grounding**
   (`googleSearchRetrieval`) when online AND a key is configured. Server-side
   only — never with Nano. Key never embedded in the client bundle (restricted
   key / tiny proxy; see §7.4).
3. **TIER 3 — Always-on fallback:** existing offline keyword knowledge base
   (`processNaturalLanguageQuery` + `expertKnowledgeBase`) + `window.AquaFlowAICore`
   rule-based enrichment. **Unchanged.**

Ordering: **Nano (ready) → remote Gemini+grounding (online+key) → offline KB+AICore.**

Plus a bundled **static local asset bank** (`src/ai-knowledge-bank.json`,
structured decision trees for common plumbing/VFD diagnostics) usable by all
tiers, and preservation of the current status-badge UI contract.

## 2. Current state (verified in repo)

| File | Role |
|---|---|
| `index.html` | Loads `https://cdn.tailwindcss.com`, `lucide`, then `/src/aicore-service.js` then `/src/script.js` (classic scripts, no modules/bundler) |
| `src/aicore-service.js` | `window.AquaFlowAICore` — rule-based offline enrichment engine (SYMPTOM_ROUTER, KB topic matcher, `enrichDiagnostics()`, `runDiagnostics()`). Fully offline. **KEEP AS-IS (Tier 3).** |
| `src/script.js` | Vanilla app. **AI DIAGNOSTICS MODULE ≈ lines 1379–1770**: `aiModelStatus`, `aiSyncEndpoint`, `aiPendingSync`/`flushAiPendingSync` (PENDING SYNC badge), `loadLocalAiModel()` (Transformers.js from CDN), `runLocalAiDiagnosis()`, `getAiReply()`, `aiStatusIndicatorHtml()`, `expertKnowledgeBase`, `processNaturalLanguageQuery()`, `aiMessageHtml`, `renderAI`, `handleSendAi` |
| `src/App.tsx`, `src/Src.App.jsx`, `src/App.css`, `src/index.css` | **Unused React scaffolding — do not touch.** |
| `android/` | Stock Capacitor 8.5.0 project; `MainActivity extends BridgeActivity` (empty); AGP 8.13.0, compileSdk/targetSdk 36, minSdk 24; INTERNET permission already present; NO ML Kit / AICore / Google GenAI deps; NO API-key plumbing |
| `capacitor.config.json` | `webDir: "www"` |
| `www/` | **Committed manual copy of the live app** (`index.html`, `src/aicore-service.js`, `src/script.js`) — this is what actually ships in the APK |
| `dist/` | Vite output of the **unused React app** (no `src/`); NOT the live app |
| `.env.sample` | No Gemini key plumbing |

Build-pipeline gotcha (verified): `npm run build` (vite) builds the unused React
scaffold into `dist/`; it does **not** build the live vanilla app. The live app's
canonical source is root `index.html` + `src/*.js`, and Capacitor packages the
**`www/` copy**. Any change to root files must be mirrored into `www/` before
`npx cap sync android`, or it will not ship.

Toolchain (verified on this factory box): `java` NOT found, `ANDROID_HOME` not
set, no `/opt/android-sdk`. Expect `./gradlew assembleDebug` and `adb` to be
unavailable here (per `android-build` skill, the studio machine at
`G:\android-sdk` is the APK build host). Plan gates below account for this.

## 3. Target architecture

```
handleSendAi(query)
  └─ getAiReply(query)                       [rewritten orchestrator]
       ├─ kbReply = processNaturalLanguageQuery(query)          (Tier 3 base, unchanged)
       ├─ enriched = AquaFlowAICore.enrichDiagnostics(query)    (always appended; unchanged)
       ├─ TIER 1: if nanoStatus === 'ready'  → plugin.generateContent(prompt)
       │            success → append Gemini Nano note (on-device)
       ├─ TIER 2: else if online && remoteGemini.isConfigured()
       │            → remoteGemini.generateWithGrounding(query, context)
       │            success → append Gemini + Search Grounding note (online)
       └─ else → return enriched (offline KB + AICore only)     (offline-first guarantee)
```

- Tier 1/2 each return `''` on any failure → automatic drop to next tier. The
  offline KB reply is computed first and is never blocked by network or model
  state.
- The old Transformers.js CDN path (`loadLocalAiModel`, `runLocalAiDiagnosis`,
  `window.__aquaflowAiPipeline`) is **replaced** by this ladder; `aiModelStatus`
  badge semantics (`idle|loading|ready|unavailable`) are preserved and now driven
  by Nano status on Android (`unavailable` on web — falls to tier 2/3).
- Sync plumbing (`aiPendingSync`, `flushAiPendingSync`, `queueChatSync`, chat
  history storage) is untouched.

## 4. Files to create / modify

### Create
1. `android/app/src/main/java/com/petrockstudios/aquaflow/plugins/AquaFlowGenAIPlugin.java`
   — Capacitor plugin (`@CapacitorPlugin(name = "AquaFlowGenAI")`) in the app
   module (simplest for a single-app repo; a standalone plugin dir under
   `android/plugins/` is the alternative if the studio wants reusability).
   Methods:
   - `isNanoAvailable()` → boolean (device capability check via ML Kit GenAI)
   - `getModelStatus()` → `unknown | notDownloaded | downloading | downloaded` (+ progress)
   - `downloadModel()` → triggers download, reports progress to JS
   - `generateContent(prompt)` → string result
   - `getRemoteApiKey()` → returns the Tier-2 key from native config at runtime
     (never from the JS bundle; see §7.4)
   - `generateRemoteContent(prompt, tools)` → OPTIONAL native-side Tier-2 REST
     call (recommended production path, keeps key off the wire from the webview)
   Web side always sees `unavailable`/`unsupported` when the plugin is absent.
2. `src/aquaflow-genai.js` — classic-script wrapper exposing `window.AquaFlowGenAI`
   with the 4 public methods (Tier 1) + key access (Tier 2). Uses
   `window.Capacitor.Plugins.AquaFlowGenAI` when present; **web stubs** return
   `{ available: false, reason: 'unsupported-platform' }` and `generateContent`
   rejects with `unavailable` in plain browsers.
3. `src/remote-gemini.js` — classic-script Tier-2 client exposing
   `window.RemoteGemini`:
   - `isConfigured()` → online && runtime key present (key injected at init,
     held in closure, never persisted)
   - `generateWithGrounding(query, context)` → REST `fetch` to
     `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
     with `tools: [{ googleSearchRetrieval: {} }]` (or the latest stable model id
     the team prefers), `systemInstruction` = field-technician safety prompt,
     temperature low. Returns `''` on any error/timeout (timeout ≈ 15–20 s so
     the field chat never hangs).
4. `src/ai-knowledge-bank.json` — static local asset bank, §5. Fetched at init,
   cached in memory + served offline because it ships inside the app bundle.
5. `local.properties` (builder-generated, **gitignored**) — optional key
   injection point for native build config.

### Modify
6. `android/app/build.gradle` — add `implementation "com.google.mlkit:genai-inference:1.0.0"`
   (see §7.1 — verify latest stable at build time; existing minSdk 24 /
   compileSdk 36 satisfy its requirements). Add `buildConfigField` plumbing for
   the remote key (read from gradle property / `local.properties`, empty by
   default).
7. `android/app/src/main/java/com/petrockstudios/aquaflow/MainActivity.java` —
   add `registerPlugin(AquaFlowGenAIPlugin.class);` in `onCreate` (override).
8. `src/script.js` — rewrite the AI module orchestrator (§3): replace
   `loadLocalAiModel`/`runLocalAiDiagnosis` with the tiered `getAiReply`; add
   `loadKnowledgeBank()`; extend `aiStatusIndicatorHtml()` (keep every existing
   badge, add `NANO` variant when ready); update the AI-tab intro copy to
   describe the Nano → remote → KB ladder; load the KB at `initAiConnectivity`
   time. Keep `processNaturalLanguageQuery`, `expertKnowledgeBase`,
   `aiPendingSync`/`flushAiPendingSync`, chat history, and `handleSendAi`
   untouched.
9. `index.html` — add `<script src="/src/aquaflow-genai.js"></script>` and
   `<script src="/src/remote-gemini.js"></script>` BEFORE `/src/script.js`
   (same pattern as `aicore-service.js`).
10. **Sync copies in `www/`**: `www/index.html`, `www/src/script.js`,
    `www/src/aicore-service.js`, plus new `www/src/aquaflow-genai.js`,
    `www/src/remote-gemini.js`, `www/src/ai-knowledge-bank.json`. Mirrored by a
    documented sync step (§8), not hand-copied ad hoc.
11. `.gitignore` — add `local.properties` (builder task; planner is read-only).

### Do NOT touch
- `src/aicore-service.js` internals (`window.AquaFlowAICore` stays the offline
  enrichment engine — do not rename/replace).
- React scaffolding (`src/App.tsx`, `src/Src.App.jsx`, `src/App.css`,
  `src/index.css`), `vite.config.ts`, `dist/`, `public/`.
- The `aiSyncEndpoint` / PENDING SYNC plumbing and chat history storage.

## 5. Static local asset bank (`src/ai-knowledge-bank.json`)

Purpose: one bundled, structured, offline-usable source of diagnostic decision
trees shared by every tier — Tier 3 AICore can read it for extra depth, Tier 1/2
prompts can embed the matching subtree as grounding context.

Schema (draft — builder may refine, keep fields stable):
```json
{
  "version": 1,
  "updated": "ISO-8601",
  "trees": [
    {
      "id": "pressure-tank-short-cycling",
      "title": "Pressure tank short cycling",
      "keywords": ["short cycle", "rapid", "cycling", "on and off", "waterlogged"],
      "nodes": {
        "start": {
          "question": "Does the pump restart within seconds of cut-out?",
          "branches": [
            { "answer": "yes", "next": "check-precharge" },
            { "answer": "no",  "next": "check-demand" }
          ]
        },
        "check-precharge": {
          "prompt": "Compare tank precharge to cut-in minus 2 PSI...",
          "diagnosis": "Waterlogged tank or wrong precharge",
          "checks": ["Drain tank, measure air charge", "Restore power, time run"],
          "references": ["grundfos.cue100.p017", "pentek.intellidrive.transducer"]
        }
      }
    }
  ]
}
```

Seed set — mirror the existing AICore symptom router so tiers agree:
`shortCycling`, `lowPressure`, `noWater`, `pumpRunsContinuous`, `vfdGrundfos`,
`pentek`, `clack`, `waterQuality`, `electrical` + at least one multi-step
plumbing/VFD tree each for Grundfos CUE 100, Pentek Intellidrive, Clack WS1.
Loader: `loadKnowledgeBank()` fetches `/src/ai-knowledge-bank.json` with
graceful failure (cache null → tiers just skip KB grounding); expose
`window.__aiKnowledgeBank` + `findTreeForQuery(query)` helper in `script.js`.

## 6. Status-badge UI contract (preserve)

`aiStatusIndicatorHtml()` must keep every existing badge and its trigger:
- **Online / Offline** pill (`getAiConnectivity()`)
- **LOCAL AI READY** (emerald) — `aiModelStatus === 'ready'` (now = Nano ready)
- **LOADING LOCAL AI** (amber) — `aiModelStatus === 'loading'` (Nano downloading)
- **KNOWLEDGE BASE** (slate) — online but no model ready
- **AICORE** (cyan) — `window.AquaFlowAICore` present
- **N PENDING SYNC** (blue) — `aiPendingSync.length > 0`

Additions allowed: a **NANO** mini-badge when `nanoStatus === 'ready'`, and a
per-reply **tier attribution footer** in the chat HTML:
`Powered by Gemini Nano (on-device)` / `Powered by Gemini with Search Grounding
(online)` / `Offline knowledge base + AICore deep diagnostics`. The AICore
enrichment block (`AICore Deep Diagnostics` header) stays exactly as-is.

## 7. Risks, flags & guardrails

### 7.1 SDK choice / version (FLAG)
Primary: `com.google.mlkit:genai-inference` — the stable documented path; the
repo has no blockers (minSdk 24, compileSdk 36, AGP 8.13 all satisfy it).
**Pin the latest stable version at build time** (start from `1.0.0`, verify
against Google Maven when resolving; do NOT hand-pick a random newer number
without checking it resolves). The exact `GenAiSdk` method surface differs by
library version — implement against the resolved jar's javadoc (model
object → `isDownloaded()`, `downloadModel(executor, callback)`,
`generateContent(...)`; device support query for `isNanoAvailable()`).
If the artifact fails to resolve or pulls requirements this project can't meet,
**stop and re-flag** — the alternative lower-level path is the AICore SDK
(`com.google.android.gms:play-services-ai`), which would then be scoped as its
own focused pass (per budget guardrail: no extensive web research now).

### 7.2 Nano device gate
Gemini Nano runs on-device via AICore and **requires a real device**
(Pixel 8/9-class, Galaxy S24-class) with Google Play services; it generally
**cannot run on emulators**. Model download needs internet + user consent.
Verification: `adb devices` — if a Nano-capable device is attached, install via
the `android-build` skill and exercise Tier 1; otherwise verify Tiers 2/3 on
desktop web and **document the Nano gate explicitly** (what was verified, what
remains device-only).

### 7.3 Build pipeline (www/ vs dist/) — CRITICAL
Every root change (index.html, src/*.js, new JSON) must be mirrored into
`www/` before `npx cap sync android`, or the APK silently ships the old app.
Add the sync step to the build docs (builder may update `README.md` —
planner is read-only).

### 7.4 API-key security (FLAG — invoke `security-hygiene` skill)
- **Never embed the key in the JS bundle, index.html, localStorage, or the repo.**
- Native-held key: gradle property / `local.properties` → `BuildConfig` →
  returned at runtime by the plugin into a JS closure; add `local.properties`
  to `.gitignore`; never log the key.
- **Production recommendation: tiny proxy** (serverless function holds the key,
  app calls the proxy) — required if Google rejects app-restricted keys for
  webview-originated HTTPS (likely: Android app restrictions are enforced by
  Google client libs, not raw fetch). Flag for the studio as a deployment
  follow-up; until then native-held key with strict rotation.
- A restricted key with app/referrer allowlist is acceptable only if the native
  client-lib path is used; follow the security-hygiene skill for rotation and
  leak scanning.

### 7.5 Offline-first guarantee
Tier 3 reply is computed before any async tier. Offline (or key-less) devices
are fully functional — this is a field tool; never block on network.

## 8. Phases & verification gates

### Phase 0 — Preflight (no code)
- Confirm the facts in §2 (already verified for this plan).
- Check `java`/`ANDROID_HOME` on the build machine (this factory box: absent).
  If absent, document that gradle/APK gates run on the studio machine
  (`G:\android-sdk`, per `android-build` skill).

### Phase 1 — Tier 3 baseline + asset bank
- Create `src/ai-knowledge-bank.json` (schema §5, seeded trees) + loader in
  `script.js` (`loadKnowledgeBank()` at init; graceful offline failure).
- Mirror into `www/`.
- **Gate:** `npm run build` still passes; `loadKnowledgeBank` returns the JSON
  with no console errors on the dev server; offline chat still returns
  KB+AICore replies byte-identical in behavior to today.

### Phase 2 — Tier 1 native (Capacitor GenAI plugin)
- Add gradle dep + `buildConfigField` plumbing (§4.6).
- Implement `AquaFlowGenAIPlugin.java` (isNanoAvailable / getModelStatus /
  downloadModel / generateContent / getRemoteApiKey) and register in
  `MainActivity`.
- Create `src/aquaflow-genai.js` (bridge + web stubs) and include it in
  `index.html` before `script.js`; mirror to `www/`.
- **Gate:** `./gradlew assembleDebug` (or studio machine if no SDK here);
  on web, `AquaFlowGenAI.isNanoAvailable()` resolves `{ available: false }`
  without errors; on a Nano device, `getModelStatus()` reflects download state.

### Phase 3 — Tier 2 remote (Gemini + Search Grounding)
- Create `src/remote-gemini.js` (§4.3) and include before `script.js`; mirror.
- Key injection path: plugin `getRemoteApiKey()` (native) with
  `AQUAFLOW_CONFIG.geminiApiKey` as web-dev fallback (runtime only, never
  committed); security-hygiene rules apply (§7.4).
- **Gate:** with a test key (dev only), online desktop chat returns a grounded
  reply with the tier footer; without a key, tier silently skipped; request
  timeout ≤ ~20 s.

### Phase 4 — Orchestration rewrite (`src/script.js`)
- Replace Transformers path with the §3 ladder; preserve badges (§6); update
  AI-tab copy; remove `__aquaflowAiPipeline` remnants.
- Mirror `src/script.js` + `index.html` to `www/`.
- **Gate:** full ladder logic review + manual tier forcing via dev-only
  overrides (`window.__forceTier`).

### Phase 5 — Verification gates (run in order)
1. `npm run build` — repo build passes (React scaffold untouched).
2. Sync www: `cp index.html www/ && cp -r src www/` (documented step).
3. `npx cap sync android`.
4. `./gradlew assembleDebug` — **if Java/Android SDK present**; otherwise run
   on the studio machine and record output (this factory box currently lacks
   `java`/`ANDROID_HOME` — do not silently skip, record the gate result).
5. QA smoke (manual, per `qa-playbook` style):
   - Chat boots; history + PENDING SYNC intact.
   - **Offline path:** dev server with network off → KB+AICore reply, Online
     badge red, no hang.
   - **Tier 2 path:** online + test key → grounded reply + "Search Grounding"
     footer; remove key → tier skipped.
   - **Tier 1 path:** `adb devices` → if Nano-capable device attached, install
     APK (`android-build` skill), run `downloadModel()` once, then chat → Nano
     reply + NANO badge. Else **document the Nano device gate explicitly**
     (verified: tiers 2/3; pending: on-device Nano).
6. Copy debug APK to `apk/` per `android-build` skill (studio machine step).

### Phase 6 — Docs (builder task, planner is read-only)
- `README.md`: document the www/ sync pipeline, tier ladder, Nano device
  requirements, and where/how the remote key is injected. No changelog asked.

## 9. Acceptance criteria (summary)
- [ ] 3-tier ladder live: Nano → remote+grounding → offline KB+AICore, with
      automatic drop on any tier failure.
- [ ] `window.AquaFlowAICore` unchanged and always the last-resort enrichment.
- [ ] Status badges preserved (Online/Offline, LOCAL AI READY, AICORE,
      PENDING SYNC + existing variants); optional NANO badge and tier footer.
- [ ] `src/ai-knowledge-bank.json` bundled, offline-loadable, consumed by tiers.
- [ ] No API key in any client bundle / repo file; security-hygiene rules
      documented and applied.
- [ ] Gates §8.5 executed; Nano device gate explicitly verified-or-deferred
      with a written record.
