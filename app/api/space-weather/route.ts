import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let currentKp = 0;
    let maxKp24h = 0;
    let solarFlux = 0;

    // Fetch Kp index from NOAA SWPC (1-minute data)
    try {
      const kpUrl = 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json';
      const response = await fetch(kpUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      });

      if (response.ok) {
        const data = await response.json();
        // Data is an array of objects: { time_tag, kp_index, estimated_kp, kp }
        if (Array.isArray(data) && data.length > 0) {
          // Get the most recent Kp reading
          const latest = data[data.length - 1];
          currentKp = parseFloat(latest.estimated_kp || latest.kp_index || '0');
          
          // Calculate max Kp in last 24 hours
          // Data is roughly 1-minute intervals, so last ~1440 entries = 24h
          const last24h = data.slice(-1440);
          for (const row of last24h) {
            const kp = parseFloat(row.estimated_kp || row.kp_index || '0');
            if (!isNaN(kp) && kp >= 0 && kp <= 9) {
              maxKp24h = Math.max(maxKp24h, kp);
            }
          }
        }
      }
    } catch (err) {
      console.error('Kp index fetch failed:', err);
    }

    // Fallback to daily NOAA planetary K-index if 1m data fails
    if (currentKp === 0) {
      try {
        const dailyUrl = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
        const response = await fetch(dailyUrl, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 }
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            currentKp = parseFloat(latest.Kp || latest.kp || '0');
            
            for (const row of data) {
              const kp = parseFloat(row.Kp || row.kp || '0');
              if (!isNaN(kp) && kp >= 0 && kp <= 9) {
                maxKp24h = Math.max(maxKp24h, kp);
              }
            }
          }
        }
      } catch (err) {
        console.error('Daily Kp fetch failed:', err);
      }
    }

    // Solar X-ray flux from GOES
    try {
      const solarUrl = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json';
      const response = await fetch(solarUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[data.length - 1];
          // flux is in W/m², convert to a more readable number (sfu - solar flux units)
          // 1 sfu = 10^-22 W/m²/Hz
          const rawFlux = parseFloat(latest.flux || latest.observed_flux || '0');
          if (!isNaN(rawFlux) && rawFlux > 0) {
            // Convert to rough SFU equivalent for display
            solarFlux = rawFlux * 1e22;
          }
        }
      }
    } catch (err) {
      console.error('Solar flux fetch failed:', err);
    }

    // If we still don't have Kp, use a reasonable default
    if (currentKp === 0) {
      currentKp = 2.0; // Quiet conditions default
    }
    if (maxKp24h === 0) {
      maxKp24h = currentKp;
    }

    // GPS degradation risk assessment
    let gpsRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let gpsRiskReason = 'GPS accuracy nominal';

    if (currentKp >= 7) {
      gpsRisk = 'HIGH';
      gpsRiskReason = 'Strong geomagnetic activity - GPS degradation likely';
    } else if (currentKp >= 5) {
      gpsRisk = 'MODERATE';
      gpsRiskReason = 'Elevated geomagnetic activity - minor GPS errors possible';
    }

    return NextResponse.json({
      currentKp,
      predictedKp: currentKp, // Use current as estimate for predicted
      maxKp24h,
      solarFlux,
      gpsRisk,
      gpsRiskReason,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Space weather API error:', error);
    // Return safe defaults instead of error
    return NextResponse.json({
      currentKp: 2.0,
      predictedKp: 2.0,
      maxKp24h: 2.0,
      solarFlux: 0,
      gpsRisk: 'LOW' as const,
      gpsRiskReason: 'GPS accuracy nominal (estimated)',
      lastUpdated: new Date().toISOString(),
    });
  }
}
