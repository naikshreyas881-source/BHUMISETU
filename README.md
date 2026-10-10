# BHUMISETU (ಭೂಮಿಸೇತು)
> **“Bridging Farms to a Better Future”**  
> **Team**: INNOVISION  
> **AI Voice Assistant**: FarmVoice AI  

---

### 🌐 Live Links
- **GitHub Repository**: [https://github.com/naikshreyas881-source/BHUMISETU](https://github.com/naikshreyas881-source/BHUMISETU)
- **Live Web Application (GitHub Pages)**: [https://naikshreyas881-source.github.io/BHUMISETU/](https://naikshreyas881-source.github.io/BHUMISETU/)

---

## 🌾 Project Overview

**BHUMISETU** is an AI-powered agricultural resource coordination platform designed for Indian farming communities. It bridges the gap between farmers needing agricultural machinery and verified equipment owners, service providers, and farm labour teams across Karnataka (Mandya, Hassan, Mysuru).

Unlike simple listing directories, BHUMISETU operates as an **intelligent, conflict-aware coordination platform** backed by real database persistence, deterministic scheduling algorithms, explainable agronomic priority scoring (0–100), real-time weather feeds, interactive Leaflet spatial maps, and a multilingual conversational AI voice assistant (**FarmVoice AI**).

---

## 🚀 Key Features

### 1. 🎙️ FarmVoice AI (Gemini Live Conversational Assistant)
- **Multilingual Interaction**: Native conversational support in **English** and **ಕನ್ನಡ (Kannada)**.
- **Backend-Mediated Operations**: Voice sessions interface through secure backend proxies (`/api/v1/voice/interact` & `/confirm`), ensuring API keys are never exposed in frontend code.
- **Structured Tool Function Calling**:
  - `search_agricultural_resources`: Discovers verified tractors, harvesters, drones, and labour.
  - `check_equipment_availability`: Validates interval overlaps and downtime.
  - `create_booking_draft`: Compiles formal scheduling and cost summaries.
  - `confirm_booking`: Enforces safety confirmation.
- **Safe Verbal Confirmation Guardrail**: FarmVoice displays the exact draft summary (Equipment, Operation, Time, Cost) on screen. The booking is created in the database **only** after the farmer speaks *"Confirm"* or clicks the confirmation button.

### 2. ⚡ Smart Agricultural Coordination Engine
- **Strict Hard Constraints Before Ranking**: Operation suitability, travel distance within service radius, budget limits, and maintenance downtime non-overlap are evaluated before scoring. High-priority requests can **never** override physical constraints.
- **Explainable Priority Score (0–100)**: Multi-factor agronomic formula:
  - *Urgency (Max 25 pts)*: Critical (25.0), High (18.0), Medium (10.0), Low (5.0).
  - *Weather Risk (Max 25 pts)*: Monsoon rain risk and severe alert impact.
  - *Crop Readiness (Max 20 pts)*: Harvesting maturity, flowering, field prep.
  - *Farm Acreage (Max 10 pts)*: Operational scale and smallholder coverage.
  - *Deadline Proximity (Max 10 pts)*: Critical window closing proximity.
  - *Soil Trafficability (Max 10 pts)*: Moisture and machine passability.
- **Transparent Missing Data Fallback**: Defaults to neutral baseline (12.5 / 25 pts) rather than assuming zero risk, and explicitly discloses missing sources.
- **Double-Booking & Conflict Detection**: Interval overlap checks prevent double bookings across active requests and maintenance downtime.

### 3. 🗺️ Interactive Leaflet Fleet Map & Spatial Search
- **OpenStreetMap & Leaflet**: Visualizes equipment locations and farm pins across Karnataka.
- **Service Radius Circles**: Interactive circular service radiuses (e.g. 25 km / 30 km).
- **One-Click Booking**: Click any marker to view details and open the booking flow.
- **Haversine Distance**: Computes exact road distance between farmer and equipment owner.

### 5. 🌦️ Weather-Based Equipment Booking Prediction (Add-On)
- **0–100 Booking Weather Suitability Score**:
  - `80–100`: **Highly Suitable** (favorable micro-climate conditions).
  - `60–79`: **Generally Suitable** (operable with precautionary measures).
  - `40–59`: **Moderate Risk** (weather risks detected; review before booking).
  - `0–39`: **High Risk** (high weather hazard; shifting booking window advised).
- **Equipment-Specific Agronomic Rules**:
  - *Sprayers & Drones*: Strict wind speed limits (> 20 km/h spray drift hazard, -45 pts) and rain wash-off risk within chemical uptake window (-40 pts).
  - *Combine Harvesters*: High rain sensitivity preventing wet grain rot, clogged thresher drums, and machinery bogging down (-50 pts).
  - *Tractors*: Rainfall compaction, wheel slip, and deep rutting prevention (-45 pts).
  - *Irrigation Pumps*: Inverted rainfall logic (heavy rain makes pumping redundant and risks root waterlogging, -55 pts; dry weather is 98-100 optimal).
  - *Seeders & Planters*: Seed wash-out and furrow crusting prevention (-45 pts).
- **1-Click Cleaner Shift Recommendations**: Discovers low-risk alternative windows (< 30% rain, < 18 km/h wind) over the next 48 hours with 1-click slot application.
- **Zero Fabrication**: Handles dates beyond 7-day forecast horizon with transparent `is_limited_prediction: true` baseline disclosure; never invents weather or soil data.
- **Advisory Non-Blocking Guardrail**: Informs farmer decisions on marketplace listings, booking dialogs, and summary screens without restricting booking autonomy.

### 6. 👥 Role-Based Dashboards & Immutable Audit Trail
- **Farmer Operations Hub (`/dashboard`)**: Managed acreage, live weather forecast widget, active scheduling pipeline, and one-click FarmVoice launcher.
- **Equipment Owner Console (`/owner`)**: Fleet inventory, incoming requests with one-click **Approve** and **Decline** controls, and total revenue tracking.
- **Administrator Security & Audit Dashboard (`/admin`)**: Immutable event logs table (`AuditLog`) tracking all user logins, bookings, and voice transactions.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, SQLite WAL (PostgreSQL switchable), Passlib/Bcrypt, JWT, HTTPX.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet, Axios.
- **AI & Voice**: Google Gemini Live API, Web Speech API (STT & TTS).
- **Weather**: Open-Meteo Meteorological Service.
- **Testing**: Pytest (22/22 tests passing), Vitest (17/17 tests passing across 7 test suites).


---

## 📦 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

### Backend Pytest Suite
```bash
cd backend
.\venv\Scripts\pytest -v
```

### Frontend Vitest Suite & Build
```bash
cd frontend
npx vitest run
npm run build
```

### Full Live End-to-End Verification
```bash
cd backend
python tests/verify_full_platform_live.py
```

---

## 👤 Pre-Configured Demonstration Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Farmer** | `farmer1@bhumisetu.org` | `SecurePassword123` | Koppa, Mandya (Paddy & Sugarcane) |
| **Equipment Owner** | `owner_manjunath@bhumisetu.org` | `OwnerSecure123` | Mandya Town (Tractor Fleet) |
| **Service Provider** | `provider_gowda@bhumisetu.org` | `ProviderSecure123` | Hassan (Harvesters & Drones) |
| **Administrator** | `admin@bhumisetu.org` | `SecurePassword123` | State Coordination Admin |

---

## 📄 License
CSE Major Engineering Project — Team INNOVISION © 2026 BHUMISETU.
