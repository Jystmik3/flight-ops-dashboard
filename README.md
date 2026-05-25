# ✈️ Flight Ops Dashboard

Real-time drone flight operations dashboard. Weather, airspace alerts, and GO/NO-GO decision logic in one place.

![Dark mission-control theme with weather, space weather, NOTAM, TFR cards and Leaflet map]

## What It Does

- **Weather** — Current conditions + 500ft AGL winds aloft (Open-Meteo)
- **Space Weather** — NOAA Kp index, GPS risk, solar flux
- **NOTAMs** — FAA Notice to Air Missions with filter tabs
- **TFRs** — Temporary Flight Restrictions with active alerting
- **Map** — Airport markers + restricted zone overlays (Leaflet)
- **GO/NO-GO** — Auto-calculated from wind, precip, Kp index, and active TFRs
- **Auto-refresh** — Every 15 minutes with countdown timer

## Quick Start

```bash
# Clone
git clone https://github.com/Jystmik3/flight-ops-dashboard.git
cd flight-ops-dashboard

# Install
npm install

# Run
npm run dev
```

Open `http://localhost:3000` (or whatever port Next.js assigns).

No API keys required — all data sources (Open-Meteo, FAA, NOAA) are free and public.

## Data Sources

| Data | Source | Key Required |
|------|--------|-------------|
| Weather | Open-Meteo API | No |
| Space Weather | NOAA SWPC | No |
| NOTAMs | FAA NOTAM API v2 | No |
| TFRs | FAA TFR API | No |
| Map Tiles | CartoDB (via Leaflet) | No |

## GO/NO-GO Logic

The dashboard evaluates four factors for flight safety:

| Factor | NO-GO | CAUTION |
|--------|-------|---------|
| Sustained Wind | > 20 mph | 15–20 mph |
| Precipitation | > 70% | 50–70% |
| Kp Index | ≥ 7 | 5–6 |
| Active TFRs | Any in area | — |

## Tech Stack

Next.js 16, React 19, Tailwind v4, Framer Motion, Leaflet

## Notes

- Built by **Leif** 🪚 — the builder agent. Don't overthink it, just ship.
- FAA APIs can be flaky — NOTAM/TFR data may return empty intermittently
- Map restricted zones are approximate hardcoded radii, not live TFR boundaries
- Designed for Denver metro area; swap coordinates in `app/api/weather/route.ts` for other locations
