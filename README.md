# ✈️ Flight Ops Dashboard

Real-time drone flight operations dashboard for the Denver metro area. Weather, space weather, live FAA NOTAMs, TFR alerts, and GO/NO-GO decision logic in one place.

![Dark mission-control theme with weather, space weather, NOTAM, TFR cards and Leaflet map]

## What It Does

- **Weather** — Current conditions + 500ft AGL winds aloft (Open-Meteo)
- **Space Weather** — NOAA Kp index, GPS risk, solar flux
- **NOTAMs** — Live FAA Notice to Air Missions for Denver-area airports
- **TFRs** — Temporary Flight Restriction candidates flagged from the live feed
- **Map** — Airport markers + restricted zone overlays (Leaflet)
- **GO/NO-GO** — Auto-calculated from wind, precip, Kp index, and active TFRs
- **Auto-refresh** — Every 15 minutes with countdown timer

## Architecture

Live FAA data comes through the **FAA SWIM NMS JMS message queue**, not a REST API.

```
FAA SWIM EMS broker  ──►  Java consumer (jumpstart)  ──►  ./log/*.xml
                                                       │
                                                       ▼
                                               Node.js bridge parser
                                                       │
                                                       ▼
                                           data/notams.json, data/tfrs.json
                                                       │
                                                       ▼
                                            Next.js API routes  ──►  Dashboard
```

1. **Java consumer** connects to the FAA SWIM broker using `nms-jumpstart.conf` and writes AIXM 5.1 XML messages to `log/`.
2. **Node bridge** (`scripts/nms-bridge.js`) parses the XML, filters to the Denver area, and writes `data/notams.json` and `data/tfrs.json`.
3. **Next.js API routes** read the JSON cache and serve the dashboard.

`nms-jumpstart.conf`, `log/`, and `data/` are all excluded from git to prevent credentials and live data from being committed.

## Quick Start

```bash
# Clone
git clone https://github.com/Jystmik3/flight-ops-dashboard.git
cd flight-ops-dashboard

# Install
npm install

# Copy environment template and edit if needed
cp .env.example .env.local

# Start the development server
npm run dev
```

Open `http://localhost:3000` (or whatever port Next.js assigns).

## Getting Live FAA NOTAMs

This dashboard requires an approved **FAA SWIM NMS** subscription. There is no embedded credential in this repo.

1. Request access at [https://nms.aim.faa.gov/](https://nms.aim.faa.gov/) or email [notams@faa.gov](mailto:notams@faa.gov).
2. Download the FAA jumpstart consumer and place the JAR in `C:/Users/<you>/Downloads/jumpstart-latest/lib/jumpstart-jar-with-dependencies.jar` (or update the paths in `scripts/create-nms-tasks.ps1`).
3. Create `nms-jumpstart.conf` in the project root from the details FAA sends you. **Keep this file out of git** — it is already in `.gitignore`.

Example `nms-jumpstart.conf` shape (fill in your own values):

```ini
providerUrl=tcps://ems2.swim.faa.gov:55443
connectionFactory=your_cf_jndi
username=your_workspace_user
password=your_password
queue=your_queue_jndi
vpn=your_vpn
```

4. Start the consumer and bridge:

```powershell
# Windows (elevated PowerShell) — registers both as startup tasks
powershell -ExecutionPolicy Bypass -File "scripts/create-nms-tasks.ps1"

# Or manually
java -Dconfig.file=nms-jumpstart.conf -jar jumpstart-jar-with-dependencies.jar
node scripts/nms-bridge.js
```

If no SWIM credentials are configured, the dashboard falls back to sample NOTAM data and an empty TFR list.

## Data Sources

| Data | Source | Credentials |
|------|--------|-------------|
| Weather | Open-Meteo API | No |
| Space Weather | NOAA SWPC | No |
| NOTAMs | FAA SWIM NMS JMS queue | **Yes** (via FAA approval) |
| TFRs | FAA SWIM NMS JMS queue / keyword extraction | **Yes** (via FAA approval) |
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
- Map restricted zones are approximate hardcoded radii, not live TFR boundaries.
- Designed for Denver metro area; swap coordinates in `app/api/weather/route.ts` for other locations.
- The `DENVER_AIRPORTS` environment variable controls which airports the bridge filters to (ICAO and domestic designators both work).
