import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tfrs.json');
const CACHE_STALE_MS = 10 * 60 * 1000; // 10 minutes

interface TfrItem {
  id: string;
  title: string;
  text: string;
  effective: string;
  expires: string;
  status: string;
}

interface LegacyTfr {
  notamId?: string;
  id?: string;
  title?: string;
  rawText?: string;
  description?: string;
  text?: string;
  effectiveDate?: string;
  effective?: string;
  expireDate?: string;
  expires?: string;
  status?: string;
}

type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

function readCache(): { tfrs: TfrItem[]; live: boolean; activeInArea: boolean } {
  try {
    const stat = fs.statSync(DATA_FILE);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > CACHE_STALE_MS) {
      return { tfrs: [], live: false, activeInArea: false };
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (Array.isArray(data.tfrs)) {
      return { tfrs: data.tfrs, live: true, activeInArea: data.activeInArea === true };
    }
  } catch {
    // cache missing or unreadable
  }
  return { tfrs: [], live: false, activeInArea: false };
}

async function fetchLegacyTfrs(): Promise<TfrItem[]> {
  try {
    const response = await fetch('https://notams.aim.faa.gov/NotamAPI/APIv2/TFRs', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FlightOps-Dashboard/1.0',
      },
      next: { revalidate: 300 },
    } as NextFetchInit);

    if (response.ok) {
      const data = await response.json();
      if (data.tfrs && Array.isArray(data.tfrs)) {
        const denverTFRs: LegacyTfr[] = data.tfrs.filter((tfr: LegacyTfr) => {
          const text = (tfr.rawText || tfr.description || '').toLowerCase();
          const title = (tfr.title || '').toLowerCase();
          return (
            text.includes('colorado') ||
            text.includes('denver') ||
            text.includes('co') ||
            title.includes('denver') ||
            title.includes('colorado')
          );
        });
        return denverTFRs.map((tfr: LegacyTfr) => ({
          id: tfr.notamId || 'TFR-' + Math.random().toString(36).slice(2, 6),
          title: tfr.title || 'TFR Notice',
          text: tfr.rawText || tfr.description || 'No details available',
          effective: tfr.effectiveDate || new Date().toISOString(),
          expires: tfr.expireDate || 'N/A',
          status: 'active',
        }));
      }
    }
  } catch {
    console.error('Legacy TFR API fetch failed');
  }
  return [];
}

export async function GET() {
  try {
    const { tfrs: cachedTfrs, live, activeInArea } = readCache();

    if (live) {
      return NextResponse.json({
        tfrs: cachedTfrs.slice(0, 20),
        count: cachedTfrs.length,
        activeInArea,
        live: true,
      });
    }

    const legacyTfrs = await fetchLegacyTfrs();
    if (legacyTfrs.length > 0) {
      return NextResponse.json({
        tfrs: legacyTfrs.slice(0, 20),
        count: legacyTfrs.length,
        activeInArea: legacyTfrs.length > 0,
        live: false,
      });
    }

    return NextResponse.json({
      tfrs: [],
      count: 0,
      activeInArea,
      live,
    });
  } catch (error) {
    console.error('TFR API error:', error);
    return NextResponse.json({
      tfrs: [],
      count: 0,
      activeInArea: false,
      live: false,
    });
  }
}
