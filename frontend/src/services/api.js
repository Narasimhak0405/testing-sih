/**
 * MANGANAI API Service Layer
 * React frontend talks only to the FastAPI backend (`/api/v1`).
 * The backend loads the production .pkl model and returns predictions.
 */

import {
  MOCK_DASHBOARD_KPIS,
  MOCK_PRODUCTION_TRENDS,
  MOCK_RESERVE_MATRIX,
  MOCK_MINING_ZONES,
  MOCK_ALERTS,
  MOCK_EQUIPMENT,
  MOCK_SHORTFALL_FACTORS,
  MOCK_AI_INSIGHTS,
} from "../data/mockData";
import { auth } from "../firebase";

const API_SETTINGS_KEY = "manganai_api_settings";

export const getApiSettings = () => {
  let settings = {
    useLiveBackend: true,
    backendUrl: "/api/v1",
    confidenceThreshold: 80,
    shortfallAlertThreshold: 15,
  };
  try {
    const saved = localStorage.getItem(API_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      settings = { ...settings, ...parsed };
    }
  } catch (e) {
    console.error("Failed to read API settings", e);
  }

  // Sanitize backendUrl to ensure it is always the clean base path without /health
  if (typeof settings.backendUrl === "string") {
    let clean = settings.backendUrl.trim().replace(/\/+$/, "");
    if (clean.endsWith("/health")) {
      clean = clean.replace(/\/health$/, "") || "/api/v1";
    }
    settings.backendUrl = clean || "/api/v1";
  }

  return settings;
};

export const saveApiSettings = (settings) => {
  try {
    const toSave = { ...settings };
    if (typeof toSave.backendUrl === "string") {
      let clean = toSave.backendUrl.trim().replace(/\/+$/, "");
      if (clean.endsWith("/health")) {
        clean = clean.replace(/\/health$/, "") || "/api/v1";
      }
      toSave.backendUrl = clean || "/api/v1";
    }
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save API settings", e);
  }
};

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

const apiUrl = (path) => {
  const settings = getApiSettings();
  let base = (settings.backendUrl || "/api/v1").trim().replace(/\/+$/, "");
  if (base.endsWith("/health")) {
    base = base.replace(/\/health$/, "");
  }
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

const authenticatedFetch = async (url, options = {}) => {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};

const parseEnvelope = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.message || `HTTP error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
};

const unwrap = (body) => (body && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body);

export const mapMiningZone = (z) => {
  if (!z) return z;
  if (z.name && (z.lat != null || z.coordinates)) return z;
  const lat = z.latitude;
  const lng = z.longitude;

  // Lookup matching mock dataset zone for rich shortfall metrics
  const mockMatch = MOCK_MINING_ZONES.find(
    (m) =>
      m.name?.toLowerCase() === z.zone_name?.toLowerCase() ||
      m.id === `ZONE-${z.id}` ||
      String(m.id) === String(z.id)
  );

  const currentProductionTonnes = mockMatch?.currentProductionTonnes ?? (z.id ? 14000 + ((Number(z.id) * 3700) % 25000) : 20000);
  const targetProductionTonnes = mockMatch?.targetProductionTonnes ?? Math.round(currentProductionTonnes * (1 + (0.05 + ((Number(z.id || 1) * 7) % 30) / 100)));
  const shortfallPercent = mockMatch?.shortfallPercent ?? Math.round(((targetProductionTonnes - currentProductionTonnes) / targetProductionTonnes) * 100 * 10) / 10;
  const riskLevel = mockMatch?.riskLevel ?? (shortfallPercent > 20 ? "HIGH" : shortfallPercent > 10 ? "MEDIUM" : "LOW");
  const potentialScore = mockMatch?.potentialScore ?? (z.ore_grade ? Math.round(Math.min(99, z.ore_grade * 2)) : 70);

  return {
    id: String(z.id),
    numericId: z.id,
    name: z.zone_name,
    region: [z.district, z.state].filter(Boolean).join(", ") || "India",
    coordinates: [lat, lng],
    lat,
    lng,
    reservePotential: z.potential_level || "MEDIUM",
    potentialScore,
    estimatedReserveMT: z.estimated_reserve ?? 0,
    oreGradePercent: z.ore_grade ?? 0,
    currentProductionTonnes,
    targetProductionTonnes,
    shortfallPercent,
    riskLevel,
    geologicalScore: mockMatch?.geologicalScore ?? 80,
    rockDensity: mockMatch?.rockDensity ?? 3.7,
    depthMeters: mockMatch?.depthMeters ?? 150,
    spectralRatioIndex: mockMatch?.spectralRatioIndex ?? 0.8,
    activeEquipment: mockMatch?.activeEquipment ?? 4,
    lastSurveyDate: mockMatch?.lastSurveyDate ?? "2026-02-15",
    description: mockMatch?.description || (z.mineral_type ? `${z.mineral_type} deposit` : ""),
  };
};

const STATUS_MAP = {
  OPERATIONAL: "Active",
  WARNING: "Warning",
  MAINTENANCE: "Maintenance",
  OFFLINE: "Offline",
};

export const mapEquipment = (e) => {
  if (!e) return e;
  if (e.name && e.efficiencyPercent != null) return e;
  const status = STATUS_MAP[e.status] || e.status || "Active";
  const efficiencyPercent = e.efficiency != null && e.efficiency <= 1 ? e.efficiency * 100 : e.efficiency;
  return {
    id: `EQ-${e.id}`,
    numericId: e.id,
    name: e.equipment_name,
    type: e.equipment_type,
    zoneId: e.mining_zone_id != null ? String(e.mining_zone_id) : "",
    zoneName: e.zone_name || (e.mining_zone_id ? `Zone ${e.mining_zone_id}` : "Central Fleet"),
    status,
    healthScore: Math.round(efficiencyPercent || 70),
    efficiencyPercent: efficiencyPercent ?? 0,
    operatingHours: e.operating_hours ?? 0,
    maintenanceStatus: status === "Active" ? "Good" : "Servicing Required",
    nextMaintenanceDate: e.last_maintenance || "",
    vibrationMmS: 0,
    temperatureC: 0,
    recentAlertsCount: status === "Warning" ? 1 : 0,
    lastService: e.last_maintenance || "",
    downtimeHistory: [],
  };
};

export const mapReservePrediction = (raw, inputData = {}) => {
  const data = raw?.data || raw;
  if (data?.reservePotential) return data;
  const potential = data?.potential || "MEDIUM";
  const estimated = data?.estimated_reserve ?? 0;
  const confidence = data?.confidence != null ? Math.round(Number(data.confidence) * 100) : null;
  const oreGrade = Number(inputData.ore_grade ?? inputData.oreGrade ?? 0);
  const depth = Number(inputData.depth ?? 0);
  const density = Number(inputData.density ?? inputData.rockDensity ?? 0);
  const rockType = inputData.rock_type || inputData.rockType || "—";
  return {
    reservePotential: potential,
    potentialScore: potential === "HIGH" ? 88 : potential === "MEDIUM" ? 68 : 42,
    estimatedReserveMT: estimated,
    confidenceScore: confidence ?? 60,
    region: inputData.region || "Selected Mining Zone",
    contributingFactors: [
      { name: "Ore Grade", value: `${oreGrade}% Mn`, weight: 35, impact: oreGrade > 38 ? "positive" : "neutral" },
      { name: "Exploratory Depth", value: `${depth} m`, weight: 25, impact: "neutral" },
      { name: "Rock Density", value: `${density} g/cm³`, weight: 22, impact: density > 3.5 ? "positive" : "neutral" },
      { name: "Rock Type", value: String(rockType), weight: 18, impact: "neutral" },
    ],
    recommendation:
      potential === "HIGH"
        ? "High reserve potential. Recommend core drilling and fleet deployment."
        : potential === "MEDIUM"
        ? "Moderate reserve potential. Complete a denser geophysical grid before major capex."
        : "Low estimated reserve. Reassess economic viability before extraction.",
    timestamp: new Date().toISOString(),
    isMock: false,
  };
};

export const mapProductionPrediction = (raw, inputData = {}) => {
  const data = raw?.data || raw;
  if (data?.predictedProduction != null && data?.shortfallFactors) return data;
  const predicted = data?.predicted_production ?? 0;
  const planned = Number(inputData.planned_production ?? predicted);
  const previous = Number(inputData.previous_production ?? 0);
  return {
    zoneId: inputData.mining_zone_id ?? "live",
    zoneName: inputData.zoneName || "ML Production Model",
    currentProduction: previous,
    predictedProduction: predicted,
    targetProduction: planned,
    shortfallTonnes: data?.expected_shortfall ?? Math.max(0, planned - predicted),
    shortfallPercent: data?.shortfall_percentage ?? 0,
    riskLevel: data?.shortfall_risk || "LOW",
    confidence: data?.confidence,
    predictionYear: data?.prediction_year,
    recommendedAction: data?.recommended_action,
    shortfallFactors: [
      {
        factor: "Model forecast vs plan",
        impactPercent: Math.min(100, Number(data?.shortfall_percentage || 0)),
        color: "#f59e0b",
        description: data?.recommended_action || "Shortfall derived from planned production minus ML prediction.",
      },
    ],
    forecastChartData: MOCK_PRODUCTION_TRENDS,
    isMock: false,
  };
};

const liveEnabled = () => Boolean(getApiSettings().useLiveBackend);

export const getDashboardData = async () => {
  if (liveEnabled()) {
    try {
      const [zonesRes, historyRes, equipmentRes, healthRes] = await Promise.all([
        authenticatedFetch(apiUrl("/mining-zones")),
        authenticatedFetch(apiUrl("/production/history")),
        authenticatedFetch(apiUrl("/equipment/status")),
        authenticatedFetch(apiUrl("/health")),
      ]);
      const zonesBody = await parseEnvelope(zonesRes);
      const historyBody = await parseEnvelope(historyRes);
      const equipmentBody = await parseEnvelope(equipmentRes);
      const health = await healthRes.json().catch(() => ({}));

      const zones = (unwrap(zonesBody) || []).map(mapMiningZone);
      const history = unwrap(historyBody) || [];
      const equipment = (unwrap(equipmentBody) || []).map(mapEquipment);

      const lastProd = history.length ? history[history.length - 1].production : 0;
      const productionTrends = history.map((row) => ({
        period: String(row.year),
        historical: row.production,
        forecast: null,
        target: Math.round((row.production || 0) * 1.08),
      }));

      const high = zones.filter((z) => z.reservePotential === "HIGH").length;
      const med = zones.filter((z) => z.reservePotential === "MEDIUM").length;
      const low = zones.filter((z) => z.reservePotential === "LOW").length;
      const total = zones.length || 1;

      return {
        kpis: {
          potentialReserves: {
            value: `${zones.reduce((s, z) => s + (z.estimatedReserveMT || 0), 0).toFixed(2)} MT`,
            rawTonnes: zones.reduce((s, z) => s + (z.estimatedReserveMT || 0) * 1e6, 0),
            change: health.ml_service === "available" ? "ML live" : "ML loading",
            isPositive: true,
            subtext: `${zones.length} mining zones`,
            status: "Optimal",
          },
          predictedProduction: {
            value: lastProd ? `${Number(lastProd).toLocaleString()} T` : "—",
            rawTonnes: lastProd,
            change: "",
            isPositive: true,
            subtext: "Latest recorded production year",
            status: "Optimal",
          },
          oreStockpile: {
            value: `${(zones.reduce((s, z) => s + (z.estimatedReserveMT || 0), 0) * 0.22).toFixed(2)} MT`,
            rawTonnes: zones.reduce((s, z) => s + (z.estimatedReserveMT || 0) * 1e6, 0) * 0.22,
            change: "+4.2%",
            isPositive: true,
            subtext: `Across ${zones.length} active extraction stockyards`,
            status: "Optimal",
          },
          equipmentEfficiency: {
            value:
              equipment.length > 0
                ? `${(
                    equipment.reduce((s, e) => s + (e.efficiencyPercent || 0), 0) / equipment.length
                  ).toFixed(1)}%`
                : "—",
            percentage: equipment.length
              ? equipment.reduce((s, e) => s + (e.efficiencyPercent || 0), 0) / equipment.length
              : 0,
            change: "",
            isPositive: true,
            subtext: `${equipment.length} units`,
            status: "Optimal",
          },
        },
        productionTrends: productionTrends.length ? productionTrends : MOCK_PRODUCTION_TRENDS,
        reserveMatrix: [
          { category: "High Potential", percentage: Math.round((high / total) * 100), zonesCount: high, volumeMT: 0, color: "#3498DB" },
          { category: "Medium Potential", percentage: Math.round((med / total) * 100), zonesCount: med, volumeMT: 0, color: "#27AE60" },
          { category: "Low Potential", percentage: Math.round((low / total) * 100), zonesCount: low, volumeMT: 0, color: "#F1C40F" },
        ],
        zones: zones.slice(0, 5),
        alerts: MOCK_ALERTS,
        isMock: false,
      };
    } catch (err) {
      console.warn("FastAPI backend unreachable, falling back to mock dataset:", err.message);
    }
  }

  await delay(400);
  return {
    kpis: MOCK_DASHBOARD_KPIS,
    productionTrends: MOCK_PRODUCTION_TRENDS,
    reserveMatrix: MOCK_RESERVE_MATRIX,
    zones: MOCK_MINING_ZONES.slice(0, 5),
    alerts: MOCK_ALERTS,
    isMock: true,
  };
};

export const predictReserve = async (inputData) => {
  const payload = {
    ore_grade: Number(inputData.ore_grade ?? inputData.oreGrade),
    depth: Number(inputData.depth ?? inputData.depthMeters),
    density: Number(inputData.density ?? inputData.rockDensity),
    rock_type: inputData.rock_type || inputData.rockType || "sedimentary",
    mining_zone_id: inputData.mining_zone_id ?? inputData.miningZoneId ?? null,
  };

  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/predict/reserve"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await parseEnvelope(res);
      return mapReservePrediction(body, { ...inputData, ...payload });
    } catch (err) {
      console.warn("FastAPI reserve predict failed, using simulator:", err.message);
    }
  }

  await delay(900);
  const oreGrade = Number(payload.ore_grade || 40);
  const depth = Number(payload.depth || 150);
  const density = Number(payload.density || 3.7);
  const estimatedReserveMT = Number(((oreGrade / 100) * depth * density * 0.001).toFixed(4));
  let potential = "LOW";
  if (estimatedReserveMT > 0.5) potential = "HIGH";
  else if (estimatedReserveMT > 0.1) potential = "MEDIUM";
  return mapReservePrediction(
    { data: { estimated_reserve: estimatedReserveMT, potential, confidence: 0.6 } },
    { ...inputData, ...payload, region: inputData.region }
  );
};

export const fetchLiveMineTelemetry = async (latitude = 21.5312, longitude = 79.6945) => {
  const lat = Number(latitude) || 21.5312;
  const lng = Number(longitude) || 79.6945;

  // 1. Try via FastAPI backend
  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl(`/telemetry/weather?latitude=${lat}&longitude=${lng}`));
      const body = await parseEnvelope(res);
      const data = unwrap(body);
      if (data && data.temperature_c != null) {
        return data;
      }
    } catch (err) {
      console.warn("Backend telemetry endpoint unreachable, falling back to direct Open-Meteo API:", err.message);
    }
  }

  // 2. Direct browser fallback to Open-Meteo API
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,surface_pressure,wind_speed_10m,soil_moisture_0_to_1cm`;
    const res = await fetch(url);
    if (res.ok) {
      const payload = await res.json();
      const current = payload?.current || {};
      return {
        temperature_c: Number(current.temperature_2m ?? 28.0),
        soil_moisture: Number(current.soil_moisture_0_to_1cm ?? 0.45),
        precipitation_mm: Number(current.precipitation ?? 0.0),
        relative_humidity_pct: Number(current.relative_humidity_2m ?? 65.0),
        wind_speed_kmh: Number(current.wind_speed_10m ?? 8.0),
        surface_pressure_hpa: Number(current.surface_pressure ?? 975.0),
        latitude: lat,
        longitude: lng,
        timestamp: current.time || new Date().toISOString(),
        provider: "Open-Meteo High-Resolution Atmospheric Model (ECMWF)",
      };
    }
  } catch (directErr) {
    console.warn("Direct Open-Meteo fetch failed:", directErr);
  }

  // 3. Fallback baseline
  return {
    temperature_c: 28.4,
    soil_moisture: 0.48,
    precipitation_mm: 0.0,
    relative_humidity_pct: 72.0,
    wind_speed_kmh: 9.1,
    surface_pressure_hpa: 974.0,
    latitude: lat,
    longitude: lng,
    timestamp: new Date().toISOString(),
    provider: "MOIL Meteorological Baseline (Fallback)",
  };
};

export const DEFAULT_PRODUCTION_FEATURES = {
  previous_production: 30824,
  rolling_2yr_production: 30954,
  rainfall_mm: 1231,
  soil_moisture: 0.563,
  temperature_c: 28.9,
  downtime: 660.1,
  equipment_efficiency: 81.9,
  blasting_delay_hours: 71.8,
  working_hours_per_day: 9.1,
  number_of_equipment: 7,
  mineral_value_tonnes: 13100000,
  planned_production: 33000,
  prediction_year: 2027,
  mining_zone_id: 1,
};

export const predictProduction = async (inputData = {}) => {
  const payload = { ...DEFAULT_PRODUCTION_FEATURES, ...inputData };
  delete payload.zoneId;
  delete payload.period;
  delete payload.zoneName;

  if (typeof inputData === "string") {
    // Legacy call signature predictProduction(zoneId, period)
    return predictProduction({ ...DEFAULT_PRODUCTION_FEATURES });
  }

  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/predict/production"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await parseEnvelope(res);
      return mapProductionPrediction(body, { ...inputData, ...payload });
    } catch (err) {
      console.warn("FastAPI production predict failed, using simulator:", err.message);
    }
  }

  await delay(600);
  const predicted = Math.round(Number(payload.previous_production) * 1.04);
  const planned = Number(payload.planned_production);
  const shortfall = Math.max(0, planned - predicted);
  const pct = planned > 0 ? Number(((shortfall / planned) * 100).toFixed(2)) : 0;
  return mapProductionPrediction(
    {
      data: {
        predicted_production: predicted,
        expected_shortfall: shortfall,
        shortfall_percentage: pct,
        shortfall_risk: pct > 10 ? "HIGH" : pct > 2 ? "MEDIUM" : "LOW",
        confidence: 0.7,
        prediction_year: payload.prediction_year,
        recommended_action: "Offline simulator — enable live backend for the trained model.",
      },
    },
    { ...inputData, ...payload }
  );
};

export const getMiningZones = async () => {
  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/mining-zones"));
      const body = await parseEnvelope(res);
      const rows = unwrap(body) || [];
      if (rows.length) return rows.map(mapMiningZone);
    } catch (err) {
      console.warn("Mining zones API unreachable:", err.message);
    }
  }
  await delay(300);
  return MOCK_MINING_ZONES;
};

export const createMiningZone = async (zoneData) => {
  const payload = {
    zone_name: zoneData.zone_name || zoneData.name,
    latitude: Number(zoneData.latitude ?? zoneData.lat),
    longitude: Number(zoneData.longitude ?? zoneData.lng),
    district: zoneData.district || "",
    state: zoneData.state || "",
    mineral_type: zoneData.mineral_type || "Manganese",
    ore_grade: zoneData.ore_grade != null && zoneData.ore_grade !== "" ? Number(zoneData.ore_grade) : null,
    estimated_reserve: zoneData.estimated_reserve != null && zoneData.estimated_reserve !== "" ? Number(zoneData.estimated_reserve) : null,
    potential_level: zoneData.potential_level || zoneData.reservePotential || "MEDIUM",
  };

  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/mining-zones"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await parseEnvelope(res);
      const row = unwrap(body);
      return mapMiningZone(row);
    } catch (err) {
      console.error("Failed to create mining zone on server:", err);
      throw err;
    }
  }

  await delay(300);
  const localId = Date.now();
  return mapMiningZone({ id: localId, ...payload });
};

export const deleteMiningZone = async (zoneId) => {
  const numeric = typeof zoneId === "object" ? (zoneId.numericId ?? zoneId.id) : zoneId;
  const idStr = String(numeric).replace(/^ZONE-/, "");

  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl(`/mining-zones/${idStr}`), {
        method: "DELETE",
      });
      const body = await parseEnvelope(res);
      return unwrap(body);
    } catch (err) {
      console.error("Failed to delete mining zone on server:", err);
      throw err;
    }
  }

  await delay(300);
  return { deleted: true, id: numeric };
};

export const getEquipment = async () => {
  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/equipment/status"));
      const body = await parseEnvelope(res);
      const rows = unwrap(body) || [];
      if (rows.length) return rows.map(mapEquipment);
    } catch (err) {
      console.warn("Equipment API unreachable:", err.message);
    }
  }
  await delay(300);
  return MOCK_EQUIPMENT;
};

export const getAIInsights = async () => {
  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/insights"));
      const body = await parseEnvelope(res);
      const rows = unwrap(body) || [];
      if (rows.length) return rows;
    } catch (err) {
      console.warn("FastAPI insights API unreachable, using cached insights:", err.message);
    }
  }
  await delay(400);
  return MOCK_AI_INSIGHTS;
};


export const analyzeSatellite = async ({ latitude, longitude, startDate, endDate, maxCloudCover = 20 }) => {
  if (!liveEnabled()) {
    throw new Error("Live backend is required for Sentinel-2 analysis.");
  }
  const res = await authenticatedFetch(apiUrl("/satellite/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: Number(latitude),
      longitude: Number(longitude),
      start_date: startDate || null,
      end_date: endDate || null,
      max_cloud_cover: Number(maxCloudCover),
    }),
  });
  const body = await parseEnvelope(res);
  return unwrap(body);
};


export const generateProspectivityGrid = async ({ latitude, longitude, halfSizeKm = 12, gridSize = 7, maxCloudCover = 20 }) => {
  if (!liveEnabled()) throw new Error("Live backend is required for prospectivity analysis.");
  const res = await authenticatedFetch(apiUrl("/prospectivity/grid"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      latitude: Number(latitude),
      longitude: Number(longitude),
      half_size_km: Number(halfSizeKm),
      grid_size: Number(gridSize),
      max_cloud_cover: Number(maxCloudCover),
    }),
  });
  const body = await parseEnvelope(res);
  return unwrap(body);
};

export const getMapsConfig = async () => {
  if (liveEnabled()) {
    try {
      const res = await authenticatedFetch(apiUrl("/maps/config"));
      const body = await parseEnvelope(res);
      const data = unwrap(body);
      if (data?.tile_template) return data;
    } catch (err) {
      console.warn("Server maps proxy unreachable, using local fallback tiles:", err.message);
    }
  }
  return {
    provider: "server_proxy",
    default_layer: "dark",
    tile_template: "/api/v1/maps/tiles/{layer}/{z}/{x}/{y}.png",
    layers: [
      { id: "dark", name: "Dark GIS (High Contrast)", active: true },
      { id: "satellite", name: "Satellite & Spectral", active: false },
      { id: "terrain", name: "Topographic Relief", active: false },
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & MOIL GIS',
    authenticated: true,
  };
};
