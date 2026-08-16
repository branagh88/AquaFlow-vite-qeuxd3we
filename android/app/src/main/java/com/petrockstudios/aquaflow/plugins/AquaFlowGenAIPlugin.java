package com.petrockstudios.aquaflow.plugins;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.petrockstudios.aquaflow.BuildConfig;

import com.google.mlkit.genai.GenAiSdk;
import com.google.mlkit.genai.GenerativeModel;
import com.google.mlkit.genai.type.DownloadState;
import com.google.mlkit.genai.type.DownloadStateCallback;
import com.google.mlkit.genai.type.GenerateContentCallback;
import com.google.mlkit.genai.type.GenerateContentResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * AquaFlowGenAI Capacitor plugin.
 *
 * Tier 1 (Gemini Nano on-device via ML Kit GenAI) + Tier 2 key access.
 * Registered in {@link com.petrockstudios.aquaflow.MainActivity}.
 *
 * Methods (all safe to call from JS; every failure resolves instead of
 * rejecting so the web ladder can drop to the next tier):
 *   - isNanoAvailable()          -> { available: boolean, reason: string }
 *   - getModelStatus()           -> { status: unknown|notDownloaded|downloading|downloaded, progress: 0..1 }
 *   - downloadModel()            -> triggers download; emits "download-progress" events
 *   - generateContent(prompt)    -> { text: string } ('' on failure)
 *   - getRemoteApiKey()          -> { apiKey: string } (native-held Tier-2 key, '' when unset)
 *   - generateRemoteContent(...) -> optional native-side Tier-2 REST call with Search Grounding
 *
 * SECURITY (security-hygiene skill):
 *   - The remote API key is NEVER in the JS bundle, localStorage, or repo.
 *     It is injected at build time via a gradle property / android/local.properties
 *     into BuildConfig.AQUAFLOW_GEMINI_API_KEY and handed to JS at runtime only.
 *   - The key is never logged. The native REST path sends it via the
 *     "x-goog-api-key" HTTP header (never in the URL).
 *
 * NOTE on the GenAiSdk surface (spec §7.1): com.google.mlkit:genai-inference
 * is pinned to 1.0.0. The exact callback types/method names below match the
 * documented 1.0.0 API (GenerativeModel -> isDownloaded() /
 * downloadModel(executor, callback) / generateContent(...)). If the resolved
 * jar exposes a different surface, adjust ONLY these private helper methods on
 * the studio machine (G:\android-sdk) against the resolved jar's javadoc.
 */
@CapacitorPlugin(name = "AquaFlowGenAI")
public class AquaFlowGenAIPlugin extends Plugin {

    private static final String TAG = "AquaFlowGenAI";
    private static final String MODEL_NAME = "gemini-nano";
    private static final String EVENT_DOWNLOAD_PROGRESS = "download-progress";
    private static final String REMOTE_MODEL_ID = "gemini-2.0-flash";
    private static final String REMOTE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/" + REMOTE_MODEL_ID + ":generateContent";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    // ------------------------------------------------------------------
    // Tier 1: Gemini Nano on-device
    // ------------------------------------------------------------------

    @PluginMethod
    public void isNanoAvailable(PluginCall call) {
        try {
            GenerativeModel model = GenAiSdk.getGenerativeModel(MODEL_NAME);
            JSObject ret = new JSObject();
            ret.put("available", model != null);
            ret.put("reason", model != null ? "ok" : "unsupported-device");
            call.resolve(ret);
        } catch (Throwable t) {
            Log.i(TAG, "Gemini Nano not available on this device: " + t.getMessage());
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("reason", "unsupported-device");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getModelStatus(PluginCall call) {
        executor.execute(() -> {
            try {
                GenerativeModel model = GenAiSdk.getGenerativeModel(MODEL_NAME);
                boolean downloaded = model != null && model.isDownloaded();
                JSObject ret = new JSObject();
                ret.put("status", downloaded ? "downloaded" : "notDownloaded");
                ret.put("progress", downloaded ? 1.0 : 0.0);
                call.resolve(ret);
            } catch (Throwable t) {
                JSObject ret = new JSObject();
                ret.put("status", "unavailable");
                ret.put("progress", 0);
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void downloadModel(PluginCall call) {
        executor.execute(() -> {
            try {
                GenerativeModel model = GenAiSdk.getGenerativeModel(MODEL_NAME);
                if (model == null) {
                    JSObject ret = new JSObject();
                    ret.put("status", "unavailable");
                    ret.put("progress", 0);
                    call.resolve(ret);
                    return;
                }
                if (model.isDownloaded()) {
                    JSObject ret = new JSObject();
                    ret.put("status", "downloaded");
                    ret.put("progress", 1.0);
                    call.resolve(ret);
                    return;
                }
                model.downloadModel(executor, new DownloadStateCallback() {
                    @Override
                    public void onDownloadProgress(DownloadState state) {
                        double progress = progressOf(state);
                        notifyDownloadProgress(progress);
                    }

                    @Override
                    public void onDownloadComplete() {
                        notifyDownloadProgress(1.0);
                        JSObject ret = new JSObject();
                        ret.put("status", "downloaded");
                        ret.put("progress", 1.0);
                        call.resolve(ret);
                    }

                    @Override
                    public void onDownloadFailed(Exception e) {
                        Log.w(TAG, "Nano model download failed", e);
                        JSObject ret = new JSObject();
                        ret.put("status", "notDownloaded");
                        ret.put("progress", 0);
                        call.resolve(ret);
                    }
                });
            } catch (Throwable t) {
                Log.w(TAG, "Nano model download start failed", t);
                JSObject ret = new JSObject();
                ret.put("status", "unavailable");
                ret.put("progress", 0);
                call.resolve(ret);
            }
        });
    }

    @PluginMethod
    public void generateContent(PluginCall call) {
        String prompt = call.getString("prompt", "");
        if (prompt == null || prompt.trim().isEmpty()) {
            call.reject("prompt required");
            return;
        }
        executor.execute(() -> {
            try {
                GenerativeModel model = GenAiSdk.getGenerativeModel(MODEL_NAME);
                if (model == null) {
                    JSObject ret = new JSObject();
                    ret.put("text", "");
                    call.resolve(ret);
                    return;
                }
                model.generateContent(prompt, executor, new GenerateContentCallback() {
                    @Override
                    public void onSuccess(GenerateContentResponse response) {
                        String text = (response != null && response.getText() != null) ? response.getText() : "";
                        JSObject ret = new JSObject();
                        ret.put("text", text);
                        call.resolve(ret);
                    }

                    @Override
                    public void onFailure(Exception e) {
                        Log.w(TAG, "Nano generateContent failed", e);
                        JSObject ret = new JSObject();
                        ret.put("text", "");
                        call.resolve(ret);
                    }
                });
            } catch (Throwable t) {
                Log.w(TAG, "Nano generateContent start failed", t);
                JSObject ret = new JSObject();
                ret.put("text", "");
                call.resolve(ret);
            }
        });
    }

    // ------------------------------------------------------------------
    // Tier 2: remote key access + optional native REST
    // ------------------------------------------------------------------

    @PluginMethod
    public void getRemoteApiKey(PluginCall call) {
        // Never log this value. Empty string when not configured at build time.
        JSObject ret = new JSObject();
        ret.put("apiKey", BuildConfig.AQUAFLOW_GEMINI_API_KEY);
        call.resolve(ret);
    }

    /**
     * Optional native-side Tier-2 REST call (recommended production path:
     * keeps the key off the wire from the webview). Expects a JSON payload:
     * { "prompt": "...", "tools": [...] }. Returns { text } or { text: '' }.
     */
    @PluginMethod
    public void generateRemoteContent(PluginCall call) {
        String prompt = call.getString("prompt", "");
        String key = BuildConfig.AQUAFLOW_GEMINI_API_KEY;
        if (key == null || key.isEmpty() || prompt == null || prompt.trim().isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("text", "");
            call.resolve(ret);
            return;
        }
        executor.execute(() -> {
            try {
                JSONObject payload = new JSONObject();
                JSONObject systemInstruction = new JSONObject();
                JSONArray sysParts = new JSONArray();
                sysParts.put(new JSONObject().put("text",
                        "You are AquaFlow, a professional field-technician assistant for water well pumps, " +
                        "pressure tanks, VFDs (Grundfos CUE 100, Pentek Intellidrive) and Clack WS1 softener " +
                        "valves. Give concise, safe troubleshooting advice. Lead with the highest-risk checks: " +
                        "dry-run protection, tank precharge, electrical supply. If a repair requires electrical " +
                        "work, remind the technician to disconnect power first."));
                systemInstruction.put("parts", sysParts);
                payload.put("systemInstruction", systemInstruction);

                JSONArray contents = new JSONArray();
                JSONObject userContent = new JSONObject();
                JSONArray userParts = new JSONArray();
                userParts.put(new JSONObject().put("text", String.valueOf(prompt)));
                userContent.put("role", "user");
                userContent.put("parts", userParts);
                contents.put(userContent);
                payload.put("contents", contents);

                JSONArray tools = new JSONArray();
                tools.put(new JSONObject().put("googleSearchRetrieval", new JSONObject()));
                payload.put("tools", tools);

                JSONObject generationConfig = new JSONObject();
                generationConfig.put("temperature", 0.2);
                generationConfig.put("maxOutputTokens", 512);
                payload.put("generationConfig", generationConfig);

                HttpURLConnection conn = (HttpURLConnection) new URL(REMOTE_URL).openConnection();
                try {
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("x-goog-api-key", key); // never in the URL, never logged
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(20000);

                    byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(body);
                    }

                    int code = conn.getResponseCode();
                    if (code < 200 || code >= 300) {
                        JSObject ret = new JSObject();
                        ret.put("text", "");
                        call.resolve(ret);
                        return;
                    }
                    String raw = readAll(conn.getInputStream());
                    JSONObject data = new JSONObject(raw);
                    String text = extractText(data);
                    JSObject ret = new JSObject();
                    ret.put("text", text == null ? "" : text);
                    call.resolve(ret);
                } finally {
                    conn.disconnect();
                }
            } catch (Throwable t) {
                Log.w(TAG, "Remote generateContent failed", t);
                JSObject ret = new JSObject();
                ret.put("text", "");
                call.resolve(ret);
            }
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private void notifyDownloadProgress(double progress) {
        JSObject data = new JSObject();
        data.put("status", "downloading");
        data.put("progress", progress);
        notifyListeners(EVENT_DOWNLOAD_PROGRESS, data, true);
    }

    private static double progressOf(DownloadState state) {
        if (state == null) return 0;
        if (state instanceof DownloadState.Downloaded) return 1.0;
        if (state instanceof DownloadState.Downloading) {
            try {
                double p = ((DownloadState.Downloading) state).getProgress();
                return (p >= 0 && p <= 1) ? p : 0;
            } catch (Throwable t) {
                return 0;
            }
        }
        return 0;
    }

    private static String readAll(InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    private static String extractText(JSONObject data) {
        try {
            JSONArray candidates = data.optJSONArray("candidates");
            if (candidates == null || candidates.length() == 0) return "";
            JSONObject content = candidates.optJSONObject(0).optJSONObject("content");
            if (content == null) return "";
            JSONArray parts = content.optJSONArray("parts");
            if (parts == null) return "";
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < parts.length(); i++) {
                String t = parts.optJSONObject(i).optString("text", "");
                text.append(t);
            }
            return text.toString().trim();
        } catch (Throwable t) {
            return "";
        }
    }
}
