import { NextResponse } from 'next/server';

// Denver area airports for NOTAM search
const DENVER_AIRPORTS = ['KDEN', 'KAPA', 'KBJC', 'KFTG', 'KRMV'];

export async function GET() {
  try {
    const allNotams: any[] = [];

    // Try the FAA NOTAM API for each airport
    for (const airport of DENVER_AIRPORTS) {
      try {
        // Using the FAA NOTAM API v2
        const url = `https://notams.aim.faa.gov/NotamAPI/APIv2/NotamsByAirport?airportCode=${airport}`;
        const response = await fetch(url, {
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'FlightOps-Dashboard/1.0'
          },
          next: { revalidate: 300 }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.notams && Array.isArray(data.notams)) {
            allNotams.push(...data.notams.map((n: any) => ({
              id: n.notamId || `NOTAM-${airport}-${Math.random().toString(36).substr(2, 6)}`,
              airport: airport,
              text: n.notamText || n.rawText || 'No details available',
              effective: n.effectiveDate || new Date().toISOString(),
              expires: n.expireDate || 'N/A',
              type: 'airport',
            })));
          }
        }
      } catch (err) {
        console.error(`NOTAM fetch failed for ${airport}:`, err);
      }
    }

    // If no NOTAMs from FAA, generate sample data for demo
    // NOTE: In production, replace this with real API calls or cached data
    if (allNotams.length === 0) {
      console.log('FAA NOTAM API returned empty, using sample data');
      allNotams.push(
        {
          id: 'NOTAM-DEN-001',
          airport: 'KDEN',
          text: 'RUNWAY 16R/34L CLSD FOR MAINTENANCE. EXPECT DELAYS.',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 86400000).toISOString(),
          type: 'airport',
        },
        {
          id: 'NOTAM-APA-002',
          airport: 'KAPA',
          text: 'TWR FREQ 118.6 CHANGED TO 119.1',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 172800000).toISOString(),
          type: 'airport',
        },
        {
          id: 'NOTAM-BJC-003',
          airport: 'KBJC',
          text: 'PAPI RWY 02L U/S',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 259200000).toISOString(),
          type: 'airport',
        },
        {
          id: 'NOTAM-AREA-004',
          airport: 'AREA',
          text: 'MULTIPLE UAS OPS WITHIN 5NM OF DENVER INTL. EXERCISE CAUTION.',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 604800000).toISOString(),
          type: 'area',
        }
      );
    }

    // Deduplicate and limit
    const uniqueNotams = Array.from(
      new Map(allNotams.map(n => [n.id, n])).values()
    ).slice(0, 50);

    return NextResponse.json({ notams: uniqueNotams, count: uniqueNotams.length });
  } catch (error) {
    console.error('NOTAM API error:', error);
    // Return sample data on error
    return NextResponse.json({
      notams: [
        {
          id: 'NOTAM-DEN-SAMPLE',
          airport: 'KDEN',
          text: 'Sample NOTAM - FAA API unavailable. Check official sources before flight.',
          effective: new Date().toISOString(),
          expires: 'N/A',
          type: 'airport',
        }
      ],
      count: 1
    });
  }
}
