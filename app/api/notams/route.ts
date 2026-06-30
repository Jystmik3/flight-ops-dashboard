import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DENVER_AIRPORTS = (process.env.DENVER_AIRPORTS || 'KDEN,KAPA,KBJC,KFTG,KRMV').split(',');
const DATA_FILE = path.join(process.cwd(), 'data', 'notams.json');
const CACHE_STALE_MS = 10 * 60 * 1000; // 10 minutes

interface NotamItem {
  id: string;
  airport: string;
  text: string;
  effective: string;
  expires: string;
  type: string;
}

interface NmsNotam {
  notamId?: string;
  id?: string;
  notamText?: string;
  text?: string;
  rawText?: string;
  effectiveDate?: string;
  effective?: string;
  expireDate?: string;
  expires?: string;
  type?: string;
}

function sampleNotams(): NotamItem[] {
  return [
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
    },
  ];
}

function readCache(): { notams: NotamItem[]; live: boolean } {
  try {
    const stat = fs.statSync(DATA_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > CACHE_STALE_MS) {
      return { notams: [], live: false };
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (Array.isArray(data.notams)) {
      return { notams: data.notams, live: true };
    }
  } catch {
    // cache missing or unreadable
  }
  return { notams: [], live: false };
}

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

async function fetchLegacyNotams(): Promise<NotamItem[]> {
  const allNotams: NotamItem[] = [];
  for (const airport of DENVER_AIRPORTS) {
    try {
      const url = 'https://notams.aim.faa.gov/NotamAPI/APIv2/NotamsByAirport?airportCode=' + airport;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FlightOps-Dashboard/1.0',
        },
        next: { revalidate: 300 },
      } as NextFetchInit);

      if (response.ok) {
        const data = await response.json();
        if (data.notams && Array.isArray(data.notams)) {
          allNotams.push(
            ...data.notams.map((n: NmsNotam) => ({
              id: n.notamId || 'NOTAM-' + airport + '-' + Math.random().toString(36).slice(2, 6),
              airport,
              text: n.notamText || n.rawText || 'No details available',
              effective: n.effectiveDate || new Date().toISOString(),
              expires: n.expireDate || 'N/A',
              type: n.type || 'airport',
            }))
          );
        }
      }
    } catch {
      console.error('Legacy NOTAM fetch failed for ' + airport);
    }
  }
  return allNotams;
}

export async function GET() {
  try {
    const { notams: cachedNotams, live } = readCache();

    if (live) {
      return NextResponse.json({
        notams: cachedNotams.slice(0, 50),
        count: cachedNotams.length,
        live: true,
      });
    }

    const legacyNotams = await fetchLegacyNotams();
    if (legacyNotams.length > 0) {
      return NextResponse.json({
        notams: legacyNotams.slice(0, 50),
        count: legacyNotams.length,
        live: false,
      });
    }

    return NextResponse.json({
      notams: sampleNotams(),
      count: sampleNotams().length,
      live: false,
    });
  } catch (error) {
    console.error('NOTAM API error:', error);
    return NextResponse.json({
      notams: sampleNotams(),
      count: sampleNotams().length,
      live: false,
    });
  }
}
