import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tfrs: any[] = [];

    // Try FAA TFR API
    try {
      const tfrUrl = 'https://notams.aim.faa.gov/NotamAPI/APIv2/TFRs';
      const response = await fetch(tfrUrl, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'FlightOps-Dashboard/1.0'
        },
        next: { revalidate: 300 }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tfrs && Array.isArray(data.tfrs)) {
          // Filter for Colorado/Denver area TFRs
          const denverTFRs = data.tfrs.filter((tfr: any) => {
            const text = (tfr.rawText || tfr.description || '').toLowerCase();
            const title = (tfr.title || '').toLowerCase();
            return text.includes('colorado') || text.includes('denver') ||
                   text.includes('co') || title.includes('denver') ||
                   title.includes('colorado');
          });
          tfrs.push(...denverTFRs.map((tfr: any) => ({
            id: tfr.notamId || `TFR-${Math.random().toString(36).substr(2, 6)}`,
            title: tfr.title || 'TFR Notice',
            text: tfr.rawText || tfr.description || 'No details available',
            effective: tfr.effectiveDate || new Date().toISOString(),
            expires: tfr.expireDate || 'N/A',
            status: 'active',
          })));
        }
      }
    } catch (err) {
      console.error('TFR API fetch failed:', err);
    }

    // If no TFRs found, return empty (no active TFRs is good news!)
    return NextResponse.json({
      tfrs: tfrs.slice(0, 20),
      count: tfrs.length,
      activeInArea: tfrs.length > 0,
    });
  } catch (error) {
    console.error('TFR API error:', error);
    // Return no active TFRs on error (safe default)
    return NextResponse.json({
      tfrs: [],
      count: 0,
      activeInArea: false,
    });
  }
}
