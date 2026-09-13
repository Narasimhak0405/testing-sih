# Manganese Exploration & Production Forecasting — API Documentation

**API Version:** 1.0.0  
**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Interactive UI:**
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema (JSON):** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 1. CORS & Communication Policy

- **Allowed Origins:** All localhost and 127.0.0.1 ports (`http://localhost:*`, `http://127.0.0.1:*`, including `5173`, `3000`, `8080`, etc.), plus any URL configured in `FRONTEND_URL`.
- **Allowed Headers:** `Content-Type`, `Authorization`, `Accept`, etc. (`*`).
- **Allowed Methods:** `GET`, `POST`, `OPTIONS`, `PUT`, `DELETE`.
- **Credentials:** Enabled (`Access-Control-Allow-Credentials: true`).

> **Rule:** The frontend communicates **only** with this FastAPI backend. The frontend never accesses ML model files or database connections directly.

---

## 2. Response & Error Schema Standards

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Standard Error Response
All errors (400, 404, 422, 500, 503) follow this uniform envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description of what went wrong."
  }
}
```

### Standard Error Codes
| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Malformed parameters or business logic conflict |
| `404` | `RESOURCE_NOT_FOUND` | Endpoint or database entity not found |
| `422` | `VALIDATION_ERROR` | Request payload failed schema validation rules |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled server error (no internal details leaked) |
| `503` | `ML_SERVICE_UNAVAILABLE` | ML prediction interface has no connected model |

---

## 3. Endpoints Reference

### 3.1 Health Checks

#### `GET /health`
Quick liveness probe to verify the server process is alive.

- **Request:** None
- **Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

#### `GET /api/v1/health`
Detailed readiness probe checking the API status, database connectivity, and ML interface status.

- **Request:** None
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "ml_service": "unavailable"
}
```

---

### 3.2 Mining Zones (for Leaflet Maps)

#### `GET /api/v1/mining-zones`
Returns all mining zone locations, GPS coordinates, ore grades, and potential levels for map rendering.

- **Request:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "zone_name": "Zone A - Tirodi Mine",
      "latitude": 21.68,
      "longitude": 79.72,
      "district": "Balaghat",
      "state": "Madhya Pradesh",
      "mineral_type": "Manganese",
      "ore_grade": 43.5,
      "estimated_reserve": 2.8,
      "potential_level": "HIGH"
    },
    {
      "id": 2,
      "zone_name": "Zone B - Dongri Buzurg",
      "latitude": 21.55,
      "longitude": 79.68,
      "district": "Bhandara",
      "state": "Maharashtra",
      "mineral_type": "Manganese",
      "ore_grade": 41.2,
      "estimated_reserve": 1.9,
      "potential_level": "MEDIUM"
    }
  ],
  "error": null
}
```

---

### 3.3 Equipment Telemetry

#### `GET /api/v1/equipment/status`
Returns real-time equipment monitoring, operating hours, efficiency ratings, and maintenance records.

- **Request:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "equipment_name": "Excavator EX-01",
      "equipment_type": "Excavator",
      "status": "OPERATIONAL",
      "operating_hours": 6840.0,
      "efficiency": 0.88,
      "last_maintenance": "2026-08-20"
    },
    {
      "id": 2,
      "equipment_name": "Drill Rig DR-04",
      "equipment_type": "Drill Rig",
      "status": "WARNING",
      "operating_hours": 4120.0,
      "efficiency": 0.76,
      "last_maintenance": "2026-07-15"
    },
    {
      "id": 3,
      "equipment_name": "Crusher CR-02",
      "equipment_type": "Crusher",
      "status": "MAINTENANCE",
      "operating_hours": 5300.0,
      "efficiency": 0.65,
      "last_maintenance": "2026-08-30"
    }
  ],
  "error": null
}
```
*Equipment Status Values:* `OPERATIONAL`, `WARNING`, `MAINTENANCE`, `OFFLINE`.

---

### 3.4 Production History (for Recharts / Chart.js)

#### `GET /api/v1/production/history`
Retrieves historical production volume. Designed to be mapped directly to React charting libraries.

- **Query Parameters (Optional):**
  - `mining_zone_id` *(integer)*: Filter data by specific mining zone ID.
  - `start_year` *(integer)*: Filter records on or after this year (inclusive).
  - `end_year` *(integer)*: Filter records on or before this year (inclusive).

- **Example Request:**
```
GET /api/v1/production/history?mining_zone_id=1&start_year=2021&end_year=2023
```

- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "year": 2021,
      "production": 66500.0
    },
    {
      "year": 2022,
      "production": 70000.0
    },
    {
      "year": 2023,
      "production": 74200.0
    }
  ],
  "error": null
}
```

---

### 3.5 Reserve Prediction

#### `POST /api/v1/reserve/predict`
Takes geological features and returns manganese reserve volume, potential classification, and model confidence score. Automatically persists the prediction record.

- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "ore_grade": 42.5,
  "depth": 85.0,
  "density": 3.8,
  "rock_type": "sedimentary",
  "mining_zone_id": 1
}
```

- **Field Rules:**
  - `ore_grade` *(float, required)*: Ore grade percentage.
  - `depth` *(float, required)*: Exploration depth in meters (must be > 0).
  - `density` *(float, required)*: Rock density in g/cm³ (must be > 0).
  - `rock_type` *(string, required)*: Geological rock type classification (e.g. `sedimentary`).
  - `mining_zone_id` *(integer, optional)*: Foreign key reference to a `mining_zones` record.

- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "estimated_reserve": 2.4,
    "potential": "HIGH",
    "confidence": 0.87
  },
  "error": null
}
```

- **Error Response — Model Not Connected (503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "ML_SERVICE_UNAVAILABLE",
    "message": "Reserve prediction model is not currently available. The ML team has not yet connected a model implementation."
  }
}
```

- **Error Response — Validation Failure (422 Unprocessable Content):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "body -> depth: Input should be greater than 0"
  }
}
```

---

### 3.6 Production Forecast

#### `POST /api/v1/production/predict`
Predicts future monthly manganese output based on 11 environmental and operational features, identifies shortfall risks, and computes expected shortfalls and prescriptive operational actions.

- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "previous_production": 30824.0,
  "rolling_2yr_production": 30954.0,
  "rainfall_mm": 1200.0,
  "soil_moisture": 0.55,
  "temperature_c": 28.0,
  "downtime": 400.0,
  "equipment_efficiency": 0.85,
  "blasting_delay_hours": 30.0,
  "working_hours_per_day": 9.0,
  "number_of_equipment": 7,
  "mineral_value_tonnes": 10000000.0,
  "planned_production": 33000.0,
  "prediction_year": 2027,
  "mining_zone_id": 1
}
```

- **Field Rules:**
  - `previous_production` *(float, required)*: Previous month production in metric tonnes (> 0).
  - `rolling_2yr_production` *(float, required)*: Recent production average on the monthly model scale (> 0).
  - `rainfall_mm` *(float, required)*: Rainfall in millimeters (≥ 0).
  - `soil_moisture` *(float, required)*: Soil moisture ratio (between 0.0 and 1.0).
  - `temperature_c` *(float, required)*: Average temperature in Celsius.
  - `downtime` *(float, required)*: Total equipment downtime in hours (≥ 0).
  - `equipment_efficiency` *(float, required)*: Fleet efficiency factor (between 0.0 and 1.0).
  - `blasting_delay_hours` *(float, required)*: Cumulative blasting clearance delays in hours (≥ 0).
  - `working_hours_per_day` *(float, required)*: Operating hours per day (between 0.0 and 24.0).
  - `number_of_equipment` *(integer, required)*: Active machinery units deployed (> 0).
  - `mineral_value_tonnes` *(float, required)*: Target mineral benchmark volume (> 0).
  - `planned_production` *(float, required)*: Planned monthly production target in tonnes (> 0).
  - `prediction_year` *(integer, required)*: Forecast target year (e.g. `2027`).
  - `mining_zone_id` *(integer, optional)*: Associated mining zone ID.

- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "predicted_production": 1600000.0,
    "shortfall_risk": "MEDIUM",
    "expected_shortfall": 50000.0,
    "shortfall_percentage": 3.03,
    "confidence": 0.84,
    "prediction_year": 2027,
    "recommended_action": "Review equipment allocation and mine schedule"
  },
  "error": null
}
```

- **Error Response — Model Not Connected (503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "ML_SERVICE_UNAVAILABLE",
    "message": "Production prediction model is not currently available. The ML team has not yet connected a model implementation."
  }
}
```

---

## 4. React Frontend Integration Examples

### Fetch Example (JavaScript / TypeScript)

```javascript
const API_BASE = 'http://localhost:8000/api/v1';

// 1. Fetch mining zones for Leaflet map
export async function getMiningZones() {
  const response = await fetch(`${API_BASE}/mining-zones`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

// 2. Fetch production history for charts
export async function getProductionHistory(zoneId, startYear, endYear) {
  const params = new URLSearchParams({
    mining_zone_id: zoneId,
    start_year: startYear,
    end_year: endYear,
  });
  const response = await fetch(`${API_BASE}/production/history?${params}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

// 3. Submit reserve prediction request
export async function predictReserve(geologicalData) {
  const response = await fetch(`${API_BASE}/reserve/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geologicalData),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}
```

### Axios Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Fetch equipment status
export const fetchEquipment = async () => {
  const { data } = await api.get('/equipment/status');
  return data.data;
};

// Predict production forecast
export const predictProduction = async (metrics) => {
  const { data } = await api.post('/production/predict', metrics);
  return data.data;
};
```
