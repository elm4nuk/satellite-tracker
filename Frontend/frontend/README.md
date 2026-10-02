# Orbital frontend

React + Vite client for the Orbital satellite tracker.

```powershell
npm install
npm run dev
```

Available checks:

```powershell
npm run lint
npm run build
```

Configuration:

- `VITE_API_URL` — FastAPI base URL. Defaults to `http://localhost:8000`.

The app uses Cesium for the globe, satellite.js for SGP4 propagation, and Anime.js for reduced-motion-aware UI entrances.
