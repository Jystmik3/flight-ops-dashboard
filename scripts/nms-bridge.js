#!/usr/bin/env node
/**
 * FAA SWIM NMS AIXM-to-JSON bridge.
 *
 * Watches the log directory written by the Java jumpstart consumer,
 * parses AIXM 5.1 NOTAM messages, filters to the Denver area, and
 * writes data/notams.json and data/tfrs.json for the dashboard API.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const LOG_DIR = process.env.NMS_LOG_DIR || path.join(ROOT, 'log');
const DATA_DIR = process.env.NMS_DATA_DIR || path.join(ROOT, 'data');
const INTERVAL_MS = Number(process.env.NMS_BRIDGE_INTERVAL_MS || '30000');
const DENVER_AIRPORTS = (process.env.DENVER_AIRPORTS || 'KDEN,DEN,KAPA,KBJC,KFTG,KRMV')
  .split(',')
  .map((s) => s.trim().toUpperCase());

const TFR_KEYWORDS = new Set(['SECURITY', 'TFR', 'VIP', 'UAS', 'STADIUM', 'AW']);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

function parseMessage(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const xmlStart = raw.indexOf('<?xml');
  const headers = xmlStart > 0 ? raw.slice(0, xmlStart) : '';
  const xml = xmlStart > 0 ? raw.slice(xmlStart) : raw;

  const nmsMessageId = firstMatch(headers, [
    /m_msg_nms_id[^\n]*value = ([^\n]+)/,
    /gml:id="NMS_ID_([^"]+)"/,
  ]);

  const notamStatus = firstMatch(headers, [
    /us_gov_dot_faa_aim_fns_nds_NOTAMStatus[^\n]*value = ([^\n]+)/,
  ]);

  const notamKeyword = firstMatch(headers, [
    /us_gov_dot_faa_aim_fns_nds_NOTAMKeyword[^\n]*value = ([^\n]+)/,
  ]);

  const sourceType = firstMatch(headers, [
    /us_gov_dot_faa_aim_fns_nds_SourceType[^\n]*value = ([^\n]+)/,
  ]);

  const lastUpdated = firstMatch(headers, [
    /m_msg_last_updated[^\n]*value = ([^\n]+)/,
  ]);

  // Core NOTAM text block
  const textNotam = firstMatch(xml, [
    /<event:textNOTAM[^>]*>([\s\S]*?)<\/event:textNOTAM>/,
    /<textNOTAM[^>]*>([\s\S]*?)<\/textNOTAM>/,
  ]);

  let notamNumber = null;
  let notamYear = null;
  let notamType = null;
  let notamLocation = null;
  let notamText = null;
  let localText = null;
  let icaoFormatted = null;
  let effectiveEnd = null;
  let issued = null;

  if (textNotam) {
    notamNumber = firstMatch(textNotam, [/<event:number>([\s\S]*?)<\/event:number>/]);
    notamYear = firstMatch(textNotam, [/<event:year>([\s\S]*?)<\/event:year>/]);
    notamType = firstMatch(textNotam, [/<event:type>([\s\S]*?)<\/event:type>/]);
    notamLocation = firstMatch(textNotam, [/<event:location>([\s\S]*?)<\/event:location>/]);
    notamText = firstMatch(textNotam, [/<event:text>([\s\S]*?)<\/event:text>/]);
    issued = firstMatch(textNotam, [/<event:issued>([\s\S]*?)<\/event:issued>/]);
    effectiveEnd = firstMatch(textNotam, [/<event:effectiveEnd>([\s\S]*?)<\/event:effectiveEnd>/]);

    localText = firstMatch(textNotam, [
      /<event:simpleText>([\s\S]*?)<\/event:simpleText>/,
      /<simpleText>([\s\S]*?)<\/simpleText>/,
    ]);

    icaoFormatted = firstMatch(textNotam, [
      /<event:formattedText>([\s\S]*?)<\/event:formattedText>/,
      /<formattedText>([\s\S]*?)<\/formattedText>/,
    ]);
  }

  // Airport/heliport ICAO identifier
  const icaoId = firstMatch(xml, [
    /<aixm:locationIndicatorICAO>([\s\S]*?)<\/aixm:locationIndicatorICAO>/,
    /<locationIndicatorICAO>([\s\S]*?)<\/locationIndicatorICAO>/,
  ]);

  // Airport/heliport designator (domestic format, e.g. DEN)
  const airportDesignator = firstMatch(xml, [
    /<aixm:designator>([\s\S]*?)<\/aixm:designator>/,
    /<designator>([\s\S]*?)<\/designator>/,
  ]);

  // Effective / expire times
  const begin = firstMatch(xml, [
    /<gml:beginPosition[^>]*>([\s\S]*?)<\/gml:beginPosition>/,
    /<beginPosition[^>]*>([\s\S]*?)<\/beginPosition>/,
  ]);

  const end = firstMatch(xml, [
    /<gml:endPosition[^>]*>([\s\S]*?)<\/gml:endPosition>/,
    /<endPosition[^>]*>([\s\S]*?)<\/endPosition>/,
  ]);

  // Try to extract a single center point from gml:pos
  let lat = null;
  let lon = null;
  const pos = firstMatch(xml, [
    /<gml:pos[^>]*>([\s\S]*?)<\/gml:pos>/,
    /<pos[^>]*>([\s\S]*?)<\/pos>/,
  ]);
  if (pos) {
    const parts = pos.trim().split(/\s+/);
    if (parts.length >= 2) {
      lat = Number(parts[0]);
      lon = Number(parts[1]);
    }
  }

  const text = localText || notamText || icaoFormatted || 'No details available';
  const airport = (icaoId || airportDesignator || notamLocation || 'UNKNOWN').toUpperCase();
  const type = DENVER_AIRPORTS.includes(airport) ? 'airport' : 'area';

  const notamId =
    airport +
    '-' +
    (notamYear || '') +
    '/' +
    (notamNumber || nmsMessageId || Math.random().toString(36).slice(2, 8));

  const effective = begin || issued || lastUpdated || new Date().toISOString();
  const expires = end || parseEffectiveEnd(effectiveEnd) || 'N/A';

  const isTfrCandidate =
    TFR_KEYWORDS.has((notamKeyword || '').toUpperCase()) ||
    /\bTFR\b/i.test(text) ||
    /\bTEMPORARY FLIGHT RESTRICTION\b/i.test(text) ||
    /\bVIP\b/i.test(text) ||
    /\bSECURITY\b/i.test(text);

  return {
    id: notamId,
    nmsMessageId,
    airport,
    locationDesignator: notamLocation,
    icaoId,
    notamNumber,
    notamYear,
    notamType,
    keyword: notamKeyword,
    status: notamStatus,
    sourceType,
    text,
    rawText: notamText,
    localText,
    effective,
    expires,
    type,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    isTfrCandidate,
  };
}

function parseEffectiveEnd(value) {
  if (!value) return null;
  // Domestic format: YYMMDDHHMM or YYMMDDHHMMSS, e.g. 2608301600
  if (/^\d{10}$/.test(value) || /^\d{12}$/.test(value)) {
    const year = '20' + value.slice(0, 2);
    const month = value.slice(2, 4);
    const day = value.slice(4, 6);
    const hour = value.slice(6, 8);
    const minute = value.slice(8, 10);
    return `${year}-${month}-${day}T${hour}:${minute}:00.000Z`;
  }
  return value;
}

function isDenverArea(record) {
  if (DENVER_AIRPORTS.includes(record.airport)) return true;

  // Domestic location designator (e.g. DEN)
  const loc = (record.locationDesignator || record.icaoId || '').toUpperCase();
  if (loc.startsWith('DEN') || loc.startsWith('KDEN')) return true;

  // Text references to Denver area
  const text = (record.text || '').toUpperCase();
  if (/\bDEN\b/.test(text) && /\b(COLORADO|CO|DENVER)\b/.test(text)) return true;
  if (/<aixm:locationIndicatorICAO>KDEN<\/aixm:locationIndicatorICAO>/.test(text)) return true;

  const lat = record.lat;
  const lon = record.lon;
  if (lat == null || lon == null) return false;

  // Denver International approximate center
  const DEN_LAT = 39.8561;
  const DEN_LON = -104.6737;
  const RADIUS_NM = Number(process.env.TFR_SEARCH_RADIUS_NM || '50');
  const NM_TO_DEG = 1 / 60;

  const dx = (lon - DEN_LON) * Math.cos((DEN_LAT * Math.PI) / 180);
  const dy = lat - DEN_LAT;
  const distNm = Math.sqrt(dx * dx + dy * dy) / NM_TO_DEG;
  return distNm <= RADIUS_NM;
}

function buildCache() {
  ensureDir(DATA_DIR);

  if (!fs.existsSync(LOG_DIR)) {
    console.log('NMS log directory does not exist yet:', LOG_DIR);
    return { notams: [], tfrs: [] };
  }

  const files = fs.readdirSync(LOG_DIR).filter((f) => !f.startsWith('.') && !f.endsWith('.tmp'));

  const notamMap = new Map();
  const tfrMap = new Map();

  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    try {
      const record = parseMessage(filePath);

      if (!record.airport || record.airport === 'UNKNOWN') continue;
      if (!isDenverArea(record)) continue;

      const key = (record.icaoId || record.locationDesignator || record.id) + '|' + record.notamNumber + '|' + record.notamYear;

      if (record.isTfrCandidate) {
        tfrMap.set(key, record);
      } else {
        notamMap.set(key, record);
      }
    } catch (err) {
      console.error('Failed to parse', filePath, err.message);
    }
  }

  const notams = Array.from(notamMap.values());
  const tfrs = Array.from(tfrMap.values());

  return { notams, tfrs };
}

function writeCache() {
  const { notams, tfrs } = buildCache();

  fs.writeFileSync(
    path.join(DATA_DIR, 'notams.json'),
    JSON.stringify({ notams, count: notams.length, updatedAt: new Date().toISOString() }, null, 2)
  );

  fs.writeFileSync(
    path.join(DATA_DIR, 'tfrs.json'),
    JSON.stringify(
      { tfrs, count: tfrs.length, activeInArea: tfrs.length > 0, updatedAt: new Date().toISOString() },
      null,
      2
    )
  );

  console.log(`[${new Date().toISOString()}] notams=${notams.length} tfrs=${tfrs.length}`);
}

function main() {
  console.log('FAA NMS bridge starting...');
  console.log('LOG_DIR:', LOG_DIR);
  console.log('DATA_DIR:', DATA_DIR);
  console.log('DENVER_AIRPORTS:', DENVER_AIRPORTS.join(','));

  ensureDir(DATA_DIR);
  writeCache();
  setInterval(writeCache, INTERVAL_MS);
}

main();
