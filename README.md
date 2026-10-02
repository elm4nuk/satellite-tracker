# Orbital Satellite Tracker

A responsive satellite mission-control interface built with React, Cesium, Anime.js, and satellite.js. The FastAPI service provides live TLE data from CelesTrak; the frontend automatically falls back to an onboard catalog when the service is unavailable.

## Project structure

```text
Frontend/frontend/src/
├── components/        # UI panels and the Cesium scene
├── data/              # Offline TLE fallback
├── hooks/             # Catalog loading and live propagation
├── lib/               # TLE parsing, orbit math, and formatting
├── App.jsx             # UI composition and interaction state
└── index.css           # Global tokens and reset

Beken/
├── app/                # Config, API models, and TLE service
├── tests/              # Backend API and cache tests
├── main.py             # Uvicorn compatibility entry point
├── requirements.txt    # Runtime dependencies
└── requirements-dev.txt
```

## Run locally

Start the API:

```powershell
cd Beken
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m uvicorn main:app --reload --port 8000
```

Start the frontend in another terminal:

```powershell
cd Frontend/frontend
npm install
npm run dev
```

The frontend uses `http://localhost:8000` by default. Override it with `VITE_API_URL` when the API is hosted elsewhere.

After both processes are running, open `http://localhost:5173` for the app and
`http://localhost:8000/docs` to inspect or execute the API endpoints directly.

## Quality checks

```powershell
cd Beken
python -m pytest -q

cd Frontend/frontend
npm run lint
npm run build
```
