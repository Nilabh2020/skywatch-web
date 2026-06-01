# SkyWatch Web

Real-time aircraft overhead alert system. Free stack, no API keys required for basic use.

## Features

- 🛰️ Live ADS-B aircraft tracking via free APIs (ADSB.lol → OpenSky → Airplanes.live fallback chain)
- 📍 Browser geolocation with manual coordinate fallback
- 🔮 Predictive closest-approach calculation using haversine + bearing projection
- 🔔 Browser notifications & sound alerts for predicted overhead passes
- ✈️ Special Airbus A380 highlighting
- 🗺️ Dark-themed Leaflet map with CartoDB dark tiles
- ⚙️ Configurable search/alert radius, lookahead time, refresh interval
- 🔒 All API calls proxied through Netlify Functions — zero keys in frontend

## Quick Start

```bash
# Install dependencies
npm install

# Run locally with Netlify Dev (proxies functions + Vite)
npx netlify dev

# Or just Vite (without serverless functions)
npm run dev
```

Open `http://localhost:8888` (Netlify Dev) or `http://localhost:5173` (Vite only).

## Deploy to Netlify

1. Push this repo to GitHub
2. Connect the repo in [Netlify Dashboard](https://app.netlify.com)
3. Build settings are auto-detected from `netlify.toml`
4. (Optional) Add environment variables in Site Settings → Environment Variables:
   - `ADSBLOL_API_KEY`
   - `OPENSKY_USERNAME` / `OPENSKY_PASSWORD`
   - `AIRPLANESLIVE_API_KEY`
5. Deploy — the app works without keys using free unauthenticated tiers

## Architecture

```
skywatch-web/
├── src/
│   ├── App.jsx              # Main app: state, data fetching, layout
│   ├── components/
│   │   ├── LocationGate.jsx  # Geolocation / manual entry landing screen
│   │   ├── AircraftMap.jsx   # Leaflet map with aircraft markers
│   │   ├── AlertPanel.jsx    # Alert list with notification/sound controls
│   │   ├── AircraftCard.jsx  # Individual aircraft alert card
│   │   └── Controls.jsx      # Sliders, toggles, refresh controls
│   └── lib/
│       ├── api.js            # Frontend fetch wrapper (calls Netlify Function)
│       ├── geo.js            # Haversine, bearing, destination calculations
│       ├── prediction.js     # Closest-approach prediction engine
│       └── aircraftNormalize.js  # Aircraft type display helpers
├── netlify/
│   └── functions/
│       └── aircraft.js       # Serverless proxy with multi-source fallback
├── netlify.toml
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## API Sources (Priority Order)

| Source | Auth Required | Rate Limit | Notes |
|--------|--------------|------------|-------|
| ADSB.lol | No (key optional) | Generous | Primary, best data |
| OpenSky Network | No (auth improves limits) | 10s anon | Fallback, no aircraft type |
| Airplanes.live | No (key optional) | Generous | Second fallback |

## Prediction Algorithm

1. Projects aircraft position forward along current track at ground speed
2. Samples 20 points over the lookahead window
3. Finds minimum haversine distance to user position
4. Reports closest distance and estimated time until closest approach
5. Filters out aircraft below 80 km/h or missing essential data

## License

MIT
