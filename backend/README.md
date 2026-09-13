# Manganese Exploration & Production Forecasting — Backend

FastAPI backend for the AI-Based Manganese Exploration and Production Forecasting System.

This service is the **single API layer** between the React frontend, the PostgreSQL database, and the ML prediction models. The frontend communicates **only** with this backend via REST/JSON.

---

## 1. Python Version

- **Python 3.11** (recommended)

---

## 2. Virtual Environment Setup

```bash
python -m venv venv
venv\Scripts\activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Database Setup

The backend supports both **SQLite** (default for local development with zero setup) and **PostgreSQL** (for production).

### Option A: SQLite (Default — Zero Setup)
No installation needed! The database file `manganese.db` is created and migrated automatically.

```
DATABASE_URL=sqlite:///./manganese.db
```

### Option B: PostgreSQL
1. Install PostgreSQL (v14+ recommended).
2. Create the database:
```sql
CREATE DATABASE manganese_db;
```
3. Set the connection string:
```
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/manganese_db
```

---

## 5. Environment Variables

Copy the template and configure your environment:

```bash
copy .env.example .env
```

Default `.env` for local development:

```env
DATABASE_URL=sqlite:///./manganese.db
FRONTEND_URL=http://localhost:5173
```

> **Never commit `.env` to version control.**

Firebase authentication is handled by the frontend Firebase SDK. The backend verifies Firebase ID tokens on `GET /api/v1/auth/me` when called with `Authorization: Bearer <id-token>`. Set `FIREBASE_PROJECT_ID` and provide Application Default Credentials or `FIREBASE_SERVICE_ACCOUNT_JSON` in deployments.

---

## 6. Database Migrations (Alembic)

Apply all migrations:

```bash
alembic upgrade head
```

Generate a new migration after model changes:

```bash
alembic revision --autogenerate -m "describe change"
```

---

## 7. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

---

## 8. API Endpoints

| Method | Endpoint                         | Description                          |
|--------|----------------------------------|--------------------------------------|
| GET    | `/health`                        | Quick liveness check                 |
| GET    | `/api/v1/health`                 | Detailed health (DB + ML status)     |
| POST   | `/api/v1/reserve/predict`        | Reserve prediction                   |
| POST   | `/api/v1/production/predict`     | Production forecast                  |
| GET    | `/api/v1/production/history`     | Historical production data           |
| GET    | `/api/v1/mining-zones`           | Mining zone info for maps            |
| GET    | `/api/v1/equipment/status`       | Equipment operational status         |
| GET    | `/api/v1/auth/me`                | Verify the signed-in Firebase user   |

### API Documentation

Detailed endpoint schemas, request/response formats, error envelope contracts, and React code examples are available in:

- **Full Documentation File**: [API_DOCUMENTATION.md](file:///c:/Users/Bhara/backend/API_DOCUMENTATION.md)
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Raw OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 9. Running Tests

```bash
pytest tests/ -v
```

Tests use an in-memory SQLite database and mocked ML interfaces — no PostgreSQL or ML model files are required.

---

## 10. ML Integration Interface

The backend defines a clean abstraction boundary in `app/services/ml_interface.py`.

The ML team should:

1. Subclass `MLPredictionInterface`.
2. Implement `predict_reserve(input_data)` and `predict_production(input_data)`.
3. Set `is_available()` to return `True`.
4. Assign the instance to `ml_prediction_interface` in the module.

Until a real ML implementation is connected, prediction endpoints return **HTTP 503** — no fake predictions are ever returned.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, error handlers, health
│   ├── config.py                # pydantic-settings configuration
│   ├── api/
│   │   ├── router.py            # Central router (/api/v1)
│   │   └── routes/              # Thin route handlers
│   ├── database/
│   │   ├── connection.py        # SQLAlchemy engine & Base
│   │   └── dependencies.py      # get_db dependency
│   ├── models/
│   │   └── database_models.py   # 6 ORM models
│   ├── schemas/                 # Pydantic request/response schemas
│   └── services/
│       ├── ml_interface.py      # ML abstraction (ABC)
│       ├── reserve_service.py
│       ├── production_service.py
│       ├── equipment_service.py
│       └── mining_zone_service.py
├── migrations/                  # Alembic migrations
├── tests/                       # pytest test suite
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```
