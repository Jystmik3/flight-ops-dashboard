'use client';

import { motion } from 'framer-motion';

interface SpaceWeatherCardProps {
  data: {
    currentKp: number;
    predictedKp: number;
    maxKp24h: number;
    solarFlux: number;
    gpsRisk: 'LOW' | 'MODERATE' | 'HIGH';
    gpsRiskReason: string;
  } | null;
  loading: boolean;
}

export default function SpaceWeatherCard({ data, loading }: SpaceWeatherCardProps) {
  const getKpColor = (kp: number) => {
    if (kp >= 7) return 'text-red-400';
    if (kp >= 5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getKpBg = (kp: number) => {
    if (kp >= 7) return 'bg-red-400';
    if (kp >= 5) return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const getGpsRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-400 border-red-400/50 bg-red-400/10';
      case 'MODERATE': return 'text-amber-400 border-amber-400/50 bg-amber-400/10';
      default: return 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10';
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-cyan-500/20 bg-black/30 p-5">
        <p className="text-gray-500 text-sm">Space weather data unavailable</p>
      </div>
    );
  }

  const { currentKp, predictedKp, maxKp24h, solarFlux, gpsRisk, gpsRiskReason } = data;

  // Kp scale visualization (0-9)
  const kpBlocks = Array.from({ length: 10 }, (_, i) => ({
    value: i,
    active: i <= Math.round(currentKp),
    warning: i >= 5,
    danger: i >= 7,
  }));

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative z-10 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
            <path fillRule="evenodd" d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" />
          </svg>
          SPACE WEATHER
        </h3>
        <span className={`text-xs font-mono ${getKpColor(currentKp)}`}>
          KP: {currentKp.toFixed(1)}
        </span>
      </div>

      {/* Kp Index Scale */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Planetary K-index (0-9)</p>
        <div className="flex gap-1">
          {kpBlocks.map((block, idx) => (
            <motion.div
              key={idx}
              initial={false}
              animate={{ opacity: block.active ? 1 : 0.3, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex-1 h-8 rounded ${
                block.danger
                  ? 'bg-red-500'
                  : block.warning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Quiet</span>
          <span className="text-amber-400">Storm G1</span>
          <span className="text-red-400">Storm G3</span>
        </div>
      </div>

      {/* GPS Risk Indicator */}
      <div className={`rounded-lg border p-3 mb-4 ${getGpsRiskColor(gpsRisk)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-70">GPS Risk</p>
            <p className="font-bold">{gpsRisk}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">24h Max KP</p>
            <p className="font-mono">{maxKp24h.toFixed(1)}</p>
          </div>
        </div>
        <p className="text-xs mt-2 opacity-80">{gpsRiskReason}</p>
      </div>

      {/* Solar Flux */}
      <div className="flex justify-between items-center pt-3 border-t border-cyan-500/20">
        <span className="text-xs text-gray-500">Solar Flux (F10.7)</span>
        <span className="text-sm font-mono text-cyan-300">{solarFlux.toFixed(0)} SFU</span>
      </div>

      {/* Thresholds Reference */}
      <div className="mt-3 p-2 rounded bg-cyan-500/5 border border-cyan-500/10">
        <p className="text-xs text-gray-400">
          <span className="text-amber-400">KP ≥ 5</span> = GPS degradation possible
          <span className="mx-2">|</span>
          <span className="text-red-400">KP ≥ 7</span> = Navigation errors likely
        </p>
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
