'use client';

import { useState, useEffect, useCallback } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import DashboardHeader from '@/components/DashboardHeader';
import GoNoGoIndicator from '@/components/GoNoGoIndicator';
import WeatherCard from '@/components/WeatherCard';
import SpaceWeatherCard from '@/components/SpaceWeatherCard';
import NotamCard from '@/components/NotamCard';
import TfrCard from '@/components/TfrCard';
import MapCard from '@/components/MapCard';

interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    precipProbability: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
  };
  aloft: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
  };
}

interface NotamData {
  notams: Array<{
    id: string;
    airport: string;
    text: string;
    effective: string;
    expires: string;
    type: string;
  }>;
  count: number;
}

interface SpaceWeatherData {
  currentKp: number;
  predictedKp: number;
  maxKp24h: number;
  solarFlux: number;
  gpsRisk: 'LOW' | 'MODERATE' | 'HIGH';
  gpsRiskReason: string;
}

interface TfrData {
  tfrs: Array<{
    id: string;
    title: string;
    text: string;
    effective: string;
    expires: string;
    status: string;
  }>;
  count: number;
  activeInArea: boolean;
}

export default function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [notams, setNotams] = useState<NotamData | null>(null);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeatherData | null>(null);
  const [tfrs, setTfrs] = useState<TfrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const [weatherRes, notamsRes, spaceWeatherRes, tfrsRes] = await Promise.all([
        fetch('/api/weather'),
        fetch('/api/notams'),
        fetch('/api/space-weather'),
        fetch('/api/tfrs'),
      ]);

      const weatherData = await weatherRes.json();
      const notamsData = await notamsRes.json();
      const spaceWeatherData = await spaceWeatherRes.json();
      const tfrsData = await tfrsRes.json();

      setWeather(weatherData);
      setNotams(notamsData);
      setSpaceWeather(spaceWeatherData);
      setTfrs(tfrsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 15 minutes (900000 ms)
    const interval = setInterval(fetchData, 900000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculate GO/NO-GO status
  const goNoGoStatus = calculateGoNoGo(weather, spaceWeather, tfrs, loading);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardHeader
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={fetchData}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* GO/NO-GO Status - Top Center */}
          <div className="max-w-4xl mx-auto mb-6">
            <GoNoGoIndicator status={goNoGoStatus.status} reasons={goNoGoStatus.reasons} />
          </div>

          {/* Main Grid */}
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Weather - Full width on mobile, 2 cols on large */}
            <div className="lg:col-span-1">
              <WeatherCard data={weather} loading={loading} />
            </div>

            {/* Space Weather */}
            <div className="lg:col-span-1">
              <SpaceWeatherCard data={spaceWeather} loading={loading} />
            </div>

            {/* TFR/Airspace */}
            <div className="lg:col-span-1">
              <TfrCard data={tfrs} loading={loading} />
            </div>
          </div>

          {/* Second Row - NOTAMs and Map */}
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NOTAMs */}
            <div className="lg:col-span-1">
              <NotamCard data={notams} loading={loading} />
            </div>

            {/* Map */}
            <div className="lg:col-span-1">
              <MapCard tfrData={tfrs} />
            </div>
          </div>

          {/* Thresholds Reference */}
          <div className="max-w-4xl mx-auto mt-6">
            <ThresholdsCard />
          </div>
        </main>
      </div>
    </div>
  );
}

function calculateGoNoGo(
  weather: WeatherData | null,
  spaceWeather: SpaceWeatherData | null,
  tfrs: TfrData | null,
  loading: boolean
): { status: 'GO' | 'NO-GO' | 'CAUTION' | 'UNKNOWN'; reasons: string[] } {
  const reasons: string[] = [];

  // If still loading initial data, show UNKNOWN
  if (loading) {
    return {
      status: 'UNKNOWN',
      reasons: ['Loading flight conditions...'],
    };
  }

  // If we have no weather data at all after loading, show caution
  if (!weather && !spaceWeather && !tfrs) {
    return {
      status: 'UNKNOWN',
      reasons: ['Flight data unavailable - check connections'],
    };
  }

  // Check TFRs first - hard NO-GO
  if (tfrs?.activeInArea) {
    return {
      status: 'NO-GO',
      reasons: ['Active TFR in Denver metro area'],
    };
  }

  // Check wind - hard NO-GO above 20 mph
  const sustainedWind = weather?.current?.windSpeed ?? 0;
  if (sustainedWind > 20) {
    return {
      status: 'NO-GO',
      reasons: [`Sustained winds ${Math.round(sustainedWind)} mph exceed 20 mph limit`],
    };
  }

  // Check precip probability - caution above 50%
  const precipProb = weather?.current?.precipProbability ?? 0;
  if (precipProb > 70) {
    return {
      status: 'NO-GO',
      reasons: [`Precipitation probability ${precipProb}% exceeds safe operating limits`],
    };
  }

  // Check KP index - caution at 5+, high risk at 7+
  const kpIndex = spaceWeather?.currentKp ?? 0;
  if (kpIndex >= 7) {
    return {
      status: 'NO-GO',
      reasons: [
        `KP index ${kpIndex.toFixed(1)} indicates severe geomagnetic storm`,
        'GPS navigation unreliable - high risk of position errors',
      ],
    };
  }

  // Build reasons list for GO/CAUTION
  if (kpIndex >= 5) {
    reasons.push(`KP ${kpIndex.toFixed(1)}: Minor GPS degradation possible`);
  } else {
    reasons.push(`KP ${kpIndex.toFixed(1)}: GPS accuracy nominal`);
  }

  if (sustainedWind > 15) {
    reasons.push(`Wind ${Math.round(sustainedWind)} mph approaching limit`);
  } else {
    reasons.push(`Wind ${Math.round(sustainedWind)} mph within limits`);
  }

  if (precipProb > 50) {
    reasons.push(`Precip probability ${precipProb}% - monitor conditions`);
  } else if (precipProb > 0) {
    reasons.push(`Precip probability ${precipProb}%`);
  } else {
    reasons.push('No precipitation expected');
  }

  // Determine final status
  if (reasons.some(r => r.includes('approaching') || r.includes('Minor') || r.includes('monitor'))) {
    return { status: 'CAUTION', reasons };
  }

  return { status: 'GO', reasons };
}

function ThresholdsCard() {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/30 backdrop-blur-sm p-4">
      <h4 className="text-xs font-bold text-cyan-400 tracking-wider mb-3">FLIGHT THRESHOLDS REFERENCE</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-500">Max Sustained Wind</span>
          <p className="text-amber-400 font-mono">20 mph</p>
        </div>
        <div>
          <span className="text-gray-500">KP Index Limit</span>
          <p className="text-amber-400 font-mono">5.0</p>
        </div>
        <div>
          <span className="text-gray-500">Max Precip Prob</span>
          <p className="text-amber-400 font-mono">70%</p>
        </div>
        <div>
          <span className="text-gray-500">GPS Risk Level</span>
          <p className="text-amber-400 font-mono">MODERATE</p>
        </div>
      </div>
    </div>
  );
}
