'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Denver coordinates
const DENVER_CENTER = [39.7392, -104.9903] as const;

// Denver area airports
const AIRPORTS = [
  { code: 'DEN', name: 'Denver International', lat: 39.8561, lng: -104.6737 },
  { code: 'APA', name: 'Centennial Airport', lat: 39.5701, lng: -104.8492 },
  { code: 'BJC', name: 'Rocky Mountain Metro', lat: 39.9088, lng: -105.1169 },
  { code: 'FTG', name: 'Front Range', lat: 39.7853, lng: -104.5436 },
];

// No-fly zones (approximate boundaries)
const NO_FLY_ZONES = [
  { name: 'Downtown Denver', lat: 39.7392, lng: -104.9903, radius: 2000 },
  { name: 'DEN Airport', lat: 39.8561, lng: -104.6737, radius: 5000 },
  { name: 'Buckley SFB', lat: 39.7017, lng: -104.7517, radius: 4000 },
];

interface MapCardProps {
  tfrData: {
    tfrs: Array<{
      id: string;
      title: string;
      text: string;
    }>;
    activeInArea: boolean;
  } | null;
}

function MapSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-cyan-500/30" style={{ height: '350px' }}>
      <div className="h-full w-full bg-cyan-500/5 rounded animate-pulse flex items-center justify-center">
        <span className="text-cyan-400/50 text-sm">Loading Map...</span>
      </div>
    </div>
  );
}

export default function MapCard({ tfrData }: MapCardProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{ tfrData: MapCardProps['tfrData'] }> | null>(null);

  useEffect(() => {
    import('./MapWrapper').then(m => {
      setMapComponent(() => m.default);
    });
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="relative z-10 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          DENVER AIRSPACE MAP
        </h3>
        {tfrData?.activeInArea && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            TFR ACTIVE
          </span>
        )}
      </div>

      {MapComponent ? (
        <MapComponent tfrData={tfrData} />
      ) : (
        <MapSkeleton />
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-gray-400">Airport</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-amber-400" />
          <span className="text-gray-400">Restricted</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-gray-400">Center</span>
        </div>
      </div>
    </motion.div>
  );
}
