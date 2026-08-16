# AquaFlow — Professional Field Suite

Live app: `index.html` + `src/*.js` (classic scripts — no bundler for the live
app). The React + Vite scaffold under `src/App.tsx`, `src/Src.App.jsx` etc. is
UNUSED; `npm run build` only builds that scaffold into `dist/` and does NOT
build the live app.

## Hybrid Inference / Fallback Ladder (AI Diagnostics)

`getAiReply()` in `src/script.js` runs a 3-tier hybrid ladder, always
offline-first:

1. **TIER 1 — Gemini Nano (on-device, Android)** via ML Kit GenAI
   (`com.google.mlkit:genai-inference`). Exposed through the custom Capacitor
   plugin `AquaFlowGenAI` (`android/app/src/main/java/com/petrockstudios/aquaflow/plugins/AquaFlowGenAIPlugin.java`).
   Web stubs in `src/aquaflow-genai.js` report `unavailable` on plain browsers.
   Model download requires internet + user consent (the AI tab shows a
   "Download Nano model" button when the device supports Nano but the model is
   not downloaded).
2. **TIER 2 — Online Gemini with Search Grounding** via `src/remote-gemini.js`
   (`window.RemoteGemini`). REST to
   `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
   with `tools: [{ googleSearchRetrieval: {} }]`, ~20s timeout, returns `''` on
   any error so the field chat never hangs. Requires: online AND a runtime key.
3. **TIER 3 — Offline knowledge base + AICore** (`processNaturalLanguageQuery` +
   `expertKnowledgeBase` + `window.AquaFlowAICore` from `src/aicore-service.js`).
   Always computed first and never blocked by network/model state.

A bundled static asset bank (`src/ai-knowledge-bank.json`, 9 decision trees
mirroring the AICore symptom router, incl. Grundfos CUE 100, Pentek Intellidrive
and Clack WS1) is loaded by `loadKnowledgeBank()` at init, cached in memory and
served offline; tiers embed the matching tree as grounding context.

Per-reply replies carry a tier footer: "Powered by Gemini Nano (on-device)" /
"Powered by Gemini with Search Grounding (online)" / "Offline knowledge base +
AICore deep diagnostics". Status badges: Online/Offline, LOCAL AI READY,
LOADING LOCAL AI, KNOWLEDGE BASE, AICORE, N PENDING SYNC, plus a NANO badge when
the on-device model is ready.

## Remote Gemini API key (security)

- **Never** put the Gemini API key in the JS bundle, `index.html`,
  localStorage, or the repo (security-hygiene rules).
- **Native path (production):** the key is read at build time by
  `android/app/build.gradle` from `android/local.properties`
  (`aquaflow.geminiApiKey=...`) or the `AQUAFLOW_GEMINI_API_KEY` gradle
  property, compiled into `BuildConfig.AQUAFLOW_GEMINI_API_KEY`, and returned to
  JS at runtime by `AquaFlowGenAIPlugin.getRemoteApiKey()`.
- **Web-dev path:** `window.AQUAFLOW_CONFIG.geminiApiKey` (runtime-only; never
  commit).
- `android/local.properties` is gitignored. Without a key, Tier 2 is silently
  skipped and the app is fully functional offline (Tier 3).
- **Production recommendation:** a tiny proxy (serverless function) holds the
  key and the app calls the proxy; the plugin also ships an optional native-side
  REST path (`generateRemoteContent`) that keeps the key off the wire from the
  webview.

## Build-pipeline gotcha: `www/` is what ships

Capacitor packages `www/` (`capacitor.config.json` → `webDir: "www"`), NOT
`dist/`. After every change to `index.html` or `src/*.js` / `src/*.json`, sync
before `npx cap sync android`:

```bash
cp index.html www/
cp src/aicore-service.js src/script.js src/aquaflow-genai.js src/remote-gemini.js src/ai-knowledge-bank.json www/src/
```

## Android build (studio machine)

The APK build requires the Android SDK + Java 23+ (studio machine:
`G:\android-sdk` per the android-build skill). This factory box has no
`java`/`ANDROID_HOME`; run the gradle gate there:

```bash
npx cap sync android
cd android
export ANDROID_HOME="G:/android-sdk"
./gradlew assembleDebug
cd ..
```

### Gemini Nano device requirements

Nano runs on-device via AICore and requires a **real device** (Pixel 8/9-class,
Galaxy S24-class) with Google Play services; it generally cannot run on
emulators. Verify Tier 1 with `adb devices` and a Nano-capable handset:
install the APK, run `downloadModel()` once, then chat (expect the NANO badge
and the "Powered by Gemini Nano (on-device)" footer). Tiers 2/3 are verifiable
on desktop web.

### ML Kit GenAI version

`com.google.mlkit:genai-inference` is pinned to `1.0.0` in
`android/app/build.gradle` (spec §7.1). If it fails to resolve or pulls
requirements the project can't meet, STOP and re-flag — do not hand-pick a
version. If the resolved jar's `GenAiSdk` method surface differs from the
plugin's implementation, adjust `AquaFlowGenAIPlugin.java` against the resolved
jar's javadoc.