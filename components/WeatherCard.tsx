'use client';

import { motion } from 'framer-motion';

interface WeatherCardProps {
  data: {
    current: {
      temperature: number;
      humidity: number;
      precipProbability: number;
      weatherCode: number;
      windSpeed: number;
      windDirection: number;
      windGusts: number;
    } | null;
    aloft: {
      windSpeed: number;
      windDirection: number;
      temperature: number;
    } | null;
  } | null;
  loading: boolean;
}

export default function WeatherCard({ data, loading }: WeatherCardProps) {
  const getWindDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '🌨️';
    if (code <= 80) return '🌦️';
    if (code <= 86) return '🌨️';
    if (code <= 99) return '⛈️';
    return '🌡️';
  };

  const getWindStatus = (speed: number) => {
    if (speed > 20) return { status: 'NO-GO', color: 'text-red-400' };
    if (speed > 15) return { status: 'CAUTION', color: 'text-amber-400' };
    return { status: 'GO', color: 'text-emerald-400' };
  };

  if (loading) {
    return <CardSkeleton />;
  }

  const current = data?.current;
  const aloft = data?.aloft;
  const windStatus = current ? getWindStatus(current.windSpeed) : null;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm p-5 overflow-hidden"
    >
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-cyan-400 tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            WEATHER
          </h3>
          {windStatus && (
            <span className={`text-xs font-mono ${windStatus.color}`}>
              WIND: {windStatus.status}
            </span>
          )}
        </div>

        {current && (
          <div className="grid grid-cols-2 gap-4">
            {/* Current Conditions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getWeatherIcon(current.weatherCode)}</span>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(current.temperature)}°F</p>
                  <p className="text-xs text-gray-400">Surface Temp</p>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Humidity</span>
                <span className="text-cyan-300 font-mono">{current.humidity}%</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precip</span>
                <span className={`font-mono ${current.precipProbability > 50 ? 'text-amber-400' : 'text-cyan-300'}`}>
                  {current.precipProbability}%
                </span>
              </div>
            </div>

            {/* Wind Data */}
            <div className="space-y-3 border-l border-cyan-500/20 pl-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Surface Wind</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-cyan-400/50 flex items-center justify-center"
                    style={{ transform: `rotate(${current.windDirection}deg)` }}
                  >
                    <div className="w-0 h-0 border-l-2 border-l-cyan-400 border-y-2 border-y-transparent" />
                  </div>
                  <span className="text-lg font-bold text-cyan-300">
                    {Math.round(current.windSpeed)} <span className="text-xs">mph</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getWindDirection(current.windDirection)} • Gusts: {Math.round(current.windGusts)} mph
                </p>
              </div>

              {aloft && (
                <div className="pt-2 border-t border-cyan-500/20">
                  <p className="text-xs text-amber-400 mb-1">500ft AGL</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ transform: `rotate(${aloft.windDirection}deg)`, display: 'inline-block' }}
                    >
                      ➤
                    </span>
                    <span className="text-sm font-mono text-amber-300">
                      {Math.round(aloft.windSpeed)} mph
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!current && (
          <p className="text-gray-500 text-sm">Weather data unavailable</p>
        )}
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/30 p-5 animate-pulse">
      <div className="h-4 w-32 bg-cyan-500/20 rounded mb-4" />
      <div className="h-8 bg-cyan-500/10 rounded mb-4" />
      <div className="h-16 bg-cyan-500/10 rounded mb-3" />
      <div className="h-4 bg-cyan-500/10 rounded" />
    </div>
  );
}
