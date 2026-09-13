import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, AlertTriangle, Filter, Pickaxe, Sparkles, RefreshCw, BarChart2, ShieldAlert, Satellite, CloudSun, CheckCircle2 } from "lucide-react";
import ChartCard from "../components/common/ChartCard";
import RiskBadge from "../components/common/RiskBadge";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { predictProduction, getMiningZones, fetchLiveMineTelemetry, DEFAULT_PRODUCTION_FEATURES } from "../services/api";
import { formatTonnes, formatPercent } from "../utils/formatters";
import { useTheme } from "../context/ThemeContext";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const FEATURE_FIELDS = [
  { key: "previous_production", label: "Previous-month production (t)", step: "1" },
  { key: "rolling_2yr_production", label: "Recent production average (t)", step: "1" },
  { key: "rainfall_mm", label: "Rainfall (mm)", step: "0.1" },
  { key: "soil_moisture", label: "Soil moisture (0–1)", step: "0.001" },
  { key: "temperature_c", label: "Temperature (°C)", step: "0.1" },
  { key: "downtime", label: "Equipment downtime (hours)", step: "0.1" },
  { key: "equipment_efficiency", label: "Equipment efficiency (%)", step: "0.1" },
  { key: "blasting_delay_hours", label: "Blasting delay (hours)", step: "0.1" },
  { key: "working_hours_per_day", label: "Working hours / day", step: "0.1" },
  { key: "number_of_equipment", label: "Number of equipment", step: "1" },
  { key: "mineral_value_tonnes", label: "Mineral value (tonnes)", step: "1" },
  { key: "planned_production", label: "Planned monthly production (t)", step: "1" },
  { key: "prediction_year", label: "Prediction year", step: "1" },
];

export const ProductionPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const resultsRef = useRef(null);
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [form, setForm] = useState({ ...DEFAULT_PRODUCTION_FEATURES });
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    const init = async () => {
      setInitLoading(true);
      try {
        const zList = await getMiningZones();
        setZones(zList || []);
        let initialForm = { ...DEFAULT_PRODUCTION_FEATURES };
        let zoneObj = zList?.[0];
        if (zoneObj) {
          const zid = zoneObj.numericId ?? Number(zoneObj.id) ?? 1;
          setSelectedZoneId(String(zoneObj.id));
          initialForm = { ...initialForm, mining_zone_id: Number.isFinite(Number(zid)) ? Number(zid) : 1 };
          setForm(initialForm);
        }
        try {
          const initialData = await predictProduction({
            ...initialForm,
            number_of_equipment: parseInt(initialForm.number_of_equipment, 10),
            prediction_year: parseInt(initialForm.prediction_year, 10),
            mining_zone_id: initialForm.mining_zone_id ? Number(initialForm.mining_zone_id) : null,
            zoneName: zoneObj?.name,
          });
          setForecastData(initialData);
        } catch (predErr) {
          console.error("Initial forecast prediction error", predErr);
        }
      } catch (err) {
        console.error("Forecast init error", err);
      } finally {
        setInitLoading(false);
      }
    };
    init();
  }, []);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const zone = zones.find((z) => String(z.id) === String(selectedZoneId));
      const data = await predictProduction({
        ...form,
        number_of_equipment: parseInt(form.number_of_equipment, 10),
        prediction_year: parseInt(form.prediction_year, 10),
        mining_zone_id: form.mining_zone_id ? Number(form.mining_zone_id) : null,
        zoneName: zone?.name,
      });
      setForecastData(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error("Forecast fetch error", err);
      setError(err.message || "Failed to generate production forecast.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTelemetry = async () => {
    const currentZone = zones.find((z) => String(z.id) === String(selectedZoneId)) || zones[0];
    const lat = currentZone?.lat ?? currentZone?.latitude ?? 21.5312;
    const lng = currentZone?.lng ?? currentZone?.longitude ?? 79.6945;
    setTelemetryLoading(true);
    setError(null);
    try {
      const telemetry = await fetchLiveMineTelemetry(lat, lng);
      if (telemetry) {
        setLiveTelemetry(telemetry);
        setForm((prev) => ({
          ...prev,
          temperature_c: telemetry.temperature_c,
          soil_moisture: telemetry.soil_moisture,
        }));
      }
    } catch (err) {
      console.error("Telemetry sync error", err);
      setError("Failed to fetch live meteorological telemetry for this zone.");
    } finally {
      setTelemetryLoading(false);
    }
  };

  const handleGenerate = () => {
    fetchForecast();
  };

  if (initLoading) {
    return <LoadingState message="Connecting production forecast to the ML backend..." />;
  }

  if (error && !forecastData) {
    return <ErrorState title="Production Forecast Error" message={error} onRetry={handleGenerate} />;
  }

  const {
    zoneName = "Selected Zone",
    currentProduction = 0,
    predictedProduction = 0,
    targetProduction = 0,
    shortfallTonnes = 0,
    shortfallPercent = 0,
    riskLevel = "LOW",
    shortfallFactors = [],
    forecastChartData = [],
  } = forecastData || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-white border border-[#D8E6F3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B2942] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#3498DB]" />
            AI Production Forecasting & Shortfall Risk Engine
            {forecastData?.isMock === false ? (
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live MANGANAI ExtraTrees Model
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Offline Simulator
              </span>
            )}
          </h2>
          <p className="text-xs text-[#606F81] mt-1">
            Forecast monthly manganese production, evaluate target deficits, and analyze root causes for operational shortfall risk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge risk={riskLevel || "LOW"} />
        </div>
      </div>

      {/* ML Feature Form */}
      <div className="bg-white border border-[#D8E6F3] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#1B2942]">ML Production Simulation Parameters</h3>
            <p className="text-[11px] text-[#606F81] mt-0.5">
              11 operational and weather variables scored in real time by the trained FINAL ExtraTrees production model (trained 2022-2023, tested 2024, MAE: 8,079 tonnes, R²: 0.8818).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <label className="text-[10px] uppercase font-bold text-[#606F81] block mb-1">Mining zone</label>
              <select
                value={selectedZoneId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedZoneId(id);
                  const zone = zones.find((z) => String(z.id) === String(id));
                  const numeric = zone?.numericId ?? Number(zone?.id);
                  setForm((prev) => ({
                    ...prev,
                    mining_zone_id: Number.isFinite(numeric) ? numeric : prev.mining_zone_id,
                  }));
                }}
                className="bg-[#F8FBFE] border border-[#D8E6F3] text-[#1B2942] font-semibold rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-[#3498DB]"
              >
                {(zones || []).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.id})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleFetchTelemetry}
              disabled={telemetryLoading}
              className="mt-4 py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Query real-time meteorological satellite grid from Open-Meteo for this mine's coordinates"
            >
              {telemetryLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Satellite className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {telemetryLoading ? "Syncing Grid..." : "Sync Live Weather & Soil"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-4 py-2 px-5 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run ML Forecast
            </button>
            {forecastData && (
              <button
                type="button"
                onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="mt-4 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-[#1B2942] border border-[#3498DB]/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Click to jump to the result metrics and charts below"
              >
                <span>Latest: <strong className="text-[#3498DB]">{formatTonnes(predictedProduction)}</strong></span>
                <span className="text-[10px] bg-white text-[#3498DB] px-1.5 py-0.5 rounded border border-[#3498DB]/30 font-bold">Results ↓</span>
              </button>
            )}
          </div>
        </div>

        {liveTelemetry && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Satellite className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Ground Telemetry Ingested for {zones.find((z) => String(z.id) === String(selectedZoneId))?.name || "Mining Zone"}
                </div>
                <p className="text-[11px] text-emerald-800">
                  {liveTelemetry.provider} • Coordinates: {Number(liveTelemetry.latitude).toFixed(4)}°N, {Number(liveTelemetry.longitude).toFixed(4)}°E
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-900 shadow-2xs">
                🌡️ Temp: <strong>{liveTelemetry.temperature_c}°C</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-900 shadow-2xs">
                💧 Soil Moisture: <strong>{liveTelemetry.soil_moisture}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-900 shadow-2xs">
                💨 Wind: <strong>{liveTelemetry.wind_speed_kmh} km/h</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 font-semibold text-emerald-900 shadow-2xs">
                🌧️ Precip: <strong>{liveTelemetry.precipitation_mm} mm</strong>
              </span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-[#E74C3C] border border-[#E74C3C]/30 rounded-lg px-3 py-2 bg-[#FDEDEC]">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {FEATURE_FIELDS.map((field) => (
            <label key={field.key} className="text-[11px] font-semibold text-[#1B2942] space-y-1">
              <span className="text-[#606F81]">{field.label}</span>
              <input
                type="number"
                step={field.step}
                value={form[field.key]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.key]: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="w-full bg-[#F8FBFE] border border-[#D8E6F3] rounded-lg px-3 py-2 text-[#1B2942] font-mono text-xs focus:outline-none focus:border-[#3498DB]"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Top Metric Cards Row */}
      <div ref={resultsRef} className="scroll-mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-1">
          <span className="text-xs text-[#606F81] font-semibold uppercase">Current Output</span>
          <h3 className="text-xl font-bold text-[#1B2942]">{formatTonnes(currentProduction)}</h3>
          <span className="text-[10px] text-[#606F81]">Q1 2026 Actuals</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-1">
          <span className="text-xs text-[#606F81] font-semibold uppercase">Predicted Production</span>
          <h3 className="text-xl font-bold text-[#3498DB]">{formatTonnes(predictedProduction)}</h3>
          <span className="text-[10px] text-[#606F81]">AI Ensemble Forecast</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-1">
          <span className="text-xs text-[#606F81] font-semibold uppercase">Target Production</span>
          <h3 className="text-xl font-bold text-[#27AE60]">{formatTonnes(targetProduction)}</h3>
          <span className="text-[10px] text-[#606F81]">MOIL Annual Plan</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-1">
          <span className="text-xs text-[#606F81] font-semibold uppercase">Expected Deficit</span>
          <h3 className="text-xl font-bold text-[#E74C3C]">{formatTonnes(shortfallTonnes)}</h3>
          <span className="text-[10px] text-[#E74C3C] font-bold">{shortfallPercent}% Deficit</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D8E6F3] shadow-xs space-y-1 flex flex-col justify-between">
          <span className="text-xs text-[#606F81] font-semibold uppercase">Risk Status</span>
          <div className="pt-1">
            <RiskBadge risk={riskLevel || "LOW"} />
          </div>
          <span className="text-[10px] text-[#606F81]">
            {shortfallPercent > 15 ? "High Shortfall Alert" : "Normal Operation"}
          </span>
        </div>
      </div>

      {forecastData?.recommendedAction && (
        <div className="p-4 rounded-xl bg-[#E8F8F0] border border-[#27AE60]/30 text-xs text-[#1B2942]">
          <span className="font-bold uppercase tracking-wider text-[10px] text-[#27AE60] block mb-1">ML Recommended Action</span>
          {forecastData.recommendedAction}
        </div>
      )}

      {/* Main Interactive Forecast Chart */}
      <ChartCard
        title={`Production Forecast Curve — ${zoneName}`}
        subtitle="Differentiating Historical Actuals, AI Neural Net Predictions, and Target Tonnage Line"
      >
        <div className="w-full pt-2 min-h-[340px]">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={forecastChartData || []} margin={{ top: 15, right: 25, bottom: 20, left: 10 }}>
              <defs>
                <linearGradient id="prodHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3498DB" stopOpacity={isDark ? 0.45 : 0.28} />
                  <stop offset="100%" stopColor="#3498DB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="prodFore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27AE60" stopOpacity={isDark ? 0.4 : 0.25} />
                  <stop offset="100%" stopColor="#27AE60" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E293B" : "#E2ECF6"} vertical={false} />
              <XAxis dataKey="period" stroke={isDark ? "#1E293B" : "#D8E6F3"} tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#475569" }} axisLine={{ stroke: isDark ? "#1E293B" : "#D8E6F3" }} tickLine={false} />
              <YAxis
                stroke={isDark ? "#1E293B" : "#D8E6F3"}
                tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#475569" }}
                axisLine={false}
                tickLine={false}
                domain={[20000, 32000]}
                ticks={[20000, 23000, 26000, 29000, 32000]}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k T`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0D1527" : "#FFFFFF",
                  borderColor: isDark ? "#1E293B" : "#D8E6F3",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: isDark ? "#FFFFFF" : "#1B2942",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                }}
                itemStyle={{ padding: "3px 0", color: isDark ? "#F8FAFC" : "#1B2942" }}
                formatter={(val, name) => [val != null ? `${Number(val).toLocaleString()} Tonnes` : "—", name]}
              />
              <ReferenceLine
                x="Mar 2026 (Est)"
                stroke="#E74C3C"
                strokeDasharray="4 4"
                label={{ value: "Forecast Start", fill: "#E74C3C", fontSize: 10, position: "top" }}
              />
              <Area
                type="monotone"
                dataKey="historical"
                name="Historical Actuals"
                stroke="#3498DB"
                fill="url(#prodHist)"
                strokeWidth={3}
                dot={{ r: 4, fill: "#3498DB", stroke: isDark ? "#131B2E" : "#FFFFFF", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={true}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Predicted Output"
                stroke="#27AE60"
                fill="url(#prodFore)"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: "#27AE60", stroke: isDark ? "#131B2E" : "#FFFFFF", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target Threshold"
                stroke="#F1C40F"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#F1C40F", stroke: isDark ? "#131B2E" : "#FFFFFF", strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Shortfall Analysis Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizontal Factors Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#D8E6F3] rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-[#EBF3FB] pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1B2942] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#E74C3C]" />
              Shortfall Cause Attribution Breakdown
            </h3>
            <span className="text-xs font-mono font-bold text-[#606F81]">
              Total Deficit: {shortfallPercent}%
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {(shortfallFactors || []).map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-[#F8FBFE] border border-[#E2ECF6] space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#1B2942]">{f.factor}</span>
                  <span style={{ color: f.color }}>{f.impactPercent}% Contribution</span>
                </div>
                <div className="w-full bg-[#EBF3FB] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${f.impactPercent}%`, backgroundColor: f.color }}
                  />
                </div>
                <p className="text-[#606F81] text-[11px] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Mitigation Recommendations (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#D8E6F3] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#EBF3FB] pb-3">
              <h3 className="text-base font-bold text-[#1B2942] flex items-center gap-2">
                <Pickaxe className="w-4 h-4 text-[#3498DB]" />
                Operational Mitigation Actions
              </h3>
              <p className="text-xs text-[#606F81] mt-0.5">
                AI-driven strategy to reduce production shortfall risk
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#E2ECF6] space-y-1">
                <h5 className="font-bold text-[#3498DB]">1. Optimize Loader Maintenance Cycle</h5>
                <p className="text-[#606F81]">
                  Prioritize hydraulic pump overhaul for EX-003 at Zone C to prevent an estimated 14 hours of unscheduled weekly downtime.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#E2ECF6] space-y-1">
                <h5 className="font-bold text-[#27AE60]">2. Ore Blending Strategy</h5>
                <p className="text-[#606F81]">
                  Blend high-grade ore from Mansar Sector (44.1% Mn) with Chikla output to maintain ferromanganese feed specifications.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FBFE] border border-[#E2ECF6] space-y-1">
                <h5 className="font-bold text-[#3498DB]">3. Secondary Stope Haulage Rerouting</h5>
                <p className="text-[#606F81]">
                  Open secondary ramp B at Tirodi Deep to alleviate haul truck queue congestion during peak shift hours.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#E8F8F0] border border-[#27AE60]/30 text-xs text-[#1B2942]">
            <span className="font-bold block uppercase tracking-wider text-[10px] text-[#27AE60]">Expected Benefit</span>
            Implementing mitigation actions is predicted to reduce total shortfall by <strong>6.8% (approx. 5,600 tonnes)</strong> in Q2 2026.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;
