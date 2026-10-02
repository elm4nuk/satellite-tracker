# Satellite Tracker API

FastAPI service that retrieves TLE catalogs from CelesTrak, validates the feed,
and caches the latest successful response for the React frontend.

## Setup (PowerShell)

```powershell
cd Beken
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
```

The old `venv` directory can be ignored; it was created with a Python executable
from another Windows account. Use `.venv` for this project.

## Run

```powershell
python -m uvicorn main:app --reload --port 8000
```

Open these URLs:

- API overview: http://localhost:8000/
- Interactive API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- TLE response: http://localhost:8000/api/tle

## Test

```powershell
python -m pytest -q
```

Copy `.env.example` to `.env` only when you need custom ports, origins, cache
duration, request timeout, or upstream URLs.
