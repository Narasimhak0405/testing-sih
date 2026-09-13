import React, { useState, useEffect } from "react";
import { Settings, Server, Sliders, Download, CheckCircle2, AlertCircle, RefreshCw, Database } from "lucide-react";
import { getApiSettings, saveApiSettings } from "../services/api";

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    useLiveBackend: true,
    backendUrl: "/api/v1",
    confidenceThreshold: 80,
    shortfallAlertThreshold: 15,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState(null);

  useEffect(() => {
    setSettings(getApiSettings());
  }, []);

  const handleSave = () => {
    saveApiSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnStatus(null);
    try {
      let rawUrl = (settings.backendUrl || "").trim().replace(/\/+$/, "");
      if (!rawUrl) rawUrl = "/api/v1";

      // If user provided /api/v1/health, test it directly; otherwise append /health
      const testUrl = rawUrl.endsWith("/health") ? rawUrl : `${rawUrl}/health`;
      const res = await fetch(testUrl, { method: "GET" });

      if (res.ok) {
        // Automatically sanitize backendUrl to the base path so other API endpoints (like /mining-zones) work properly
        const cleanBase = rawUrl.endsWith("/health") ? rawUrl.replace(/\/health$/, "") || "/api/v1" : rawUrl;
        if (cleanBase !== settings.backendUrl) {
          const updated = { ...settings, backendUrl: cleanBase };
          setSettings(updated);
          saveApiSettings(updated);
        }
        setConnStatus({
          success: true,
          message: "FastAPI Backend Connection Successful (200 OK) — Probed " + testUrl,
        });
      } else {
        setConnStatus({
          success: false,
          message: `Server responded with HTTP status ${res.status} when testing ${testUrl}`,
        });
      }
    } catch (err) {
      setConnStatus({
        success: false,
        message: `Connection failed at ${settings.backendUrl}. Ensure the FastAPI server is running on port 8000.`,
      });
    } finally {
      setTestingConn(false);
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "platform_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1B2942] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#3498DB]" />
            Platform & Backend API Settings
          </h2>
          <p className="text-xs text-[#606F81] mt-0.5">
            Configure FastAPI endpoints, model confidence thresholds, and system export features.
          </p>
        </div>
      </div>

      {/* Backend Integration Settings Card */}
      <div className="bg-white border border-[#D8E6F3] rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-[#EBF3FB] pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B2942] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#3498DB]" />
            FastAPI Backend Connection
          </h3>
          <span className="text-xs font-medium text-[#606F81]">REST API Integration</span>
        </div>

        {/* Live vs Mock Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FBFE] border border-[#D8E6F3]">
          <div>
            <span className="font-bold text-xs text-[#1B2942] block">Data Source Mode</span>
            <span className="text-[11px] text-[#606F81]">
              {settings.useLiveBackend
                ? "Connecting directly to FastAPI REST microservices"
                : "Running in self-contained simulation mode"}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.useLiveBackend}
              onChange={(e) => setSettings({ ...settings, useLiveBackend: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#D8E6F3] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D8E6F3] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3498DB]"></div>
          </label>
        </div>

        {/* Backend REST Base URL */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-[#1B2942] block">FastAPI Base Endpoint URL</label>
            <div className="text-[11px] text-[#606F81] flex items-center gap-1.5">
              <span>Default: <code className="font-mono bg-[#EBF3FB] px-1.5 py-0.5 rounded text-[#1B2942]">/api/v1</code></span>
              {settings.backendUrl !== "/api/v1" && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, backendUrl: "/api/v1" };
                    setSettings(updated);
                    saveApiSettings(updated);
                    setConnStatus(null);
                  }}
                  className="text-[#3498DB] hover:underline font-semibold cursor-pointer ml-1"
                >
                  (Reset to /api/v1)
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={settings.backendUrl}
              onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
              placeholder="/api/v1"
              className="flex-1 bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-[#1B2942] font-mono focus:outline-none focus:border-[#3498DB] focus:ring-1 focus:ring-[#3498DB]/30 transition-all text-xs"
            />
            <button
              onClick={handleTestConnection}
              disabled={testingConn}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1B2942] font-semibold rounded-lg border border-[#D8E6F3] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              {testingConn ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3498DB]" /> : <Database className="w-3.5 h-3.5 text-[#3498DB]" />}
              Test Connection
            </button>
          </div>
          <p className="text-[11px] text-[#606F81]">
            Enter the base API prefix (use <span className="font-mono text-[#1B2942] font-bold">/api/v1</span>). When testing the connection, the platform automatically queries the <span className="font-mono text-[#1B2942]">/health</span> endpoint.
          </p>

          {connStatus && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                connStatus.success
                  ? "bg-[#E8F8F0] border-[#27AE60]/30 text-[#27AE60]"
                  : "bg-[#FDEDEC] border-[#E74C3C]/30 text-[#E74C3C]"
              }`}
            >
              {connStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {connStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Model Thresholds Settings */}
      <div className="bg-white border border-[#D8E6F3] rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-[#EBF3FB] pb-3">
          <h3 className="text-sm font-bold text-[#1B2942] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#3498DB]" />
            AI Model Alert Thresholds
          </h3>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-bold mb-1">
              <span className="text-[#1B2942]">Minimum Model Confidence Filter</span>
              <span className="text-[#3498DB] font-bold">{settings.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings.confidenceThreshold}
              onChange={(e) => setSettings({ ...settings, confidenceThreshold: parseInt(e.target.value) })}
              className="w-full accent-[#3498DB] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-bold mb-1">
              <span className="text-[#1B2942]">Production Shortfall Warning Trigger</span>
              <span className="text-[#E74C3C] font-bold">{settings.shortfallAlertThreshold}% Deficit</span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="1"
              value={settings.shortfallAlertThreshold}
              onChange={(e) => setSettings({ ...settings, shortfallAlertThreshold: parseInt(e.target.value) })}
              className="w-full accent-[#3498DB] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save & Export Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={exportJSON}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#D8E6F3] text-[#1B2942] font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-[#3498DB]" />
          Export System Config (JSON)
        </button>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs font-bold text-[#27AE60] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
