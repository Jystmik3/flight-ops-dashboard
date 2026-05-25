'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface NotamCardProps {
  data: {
    notams: Array<{
      id: string;
      airport: string;
      text: string;
      effective: string;
      expires: string;
      type: string;
    }>;
    count: number;
  } | null;
  loading: boolean;
}

export default function NotamCard({ data, loading }: NotamCardProps) {
  const [filter, setFilter] = useState<'all' | 'airport' | 'area'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredNotams = useMemo(() => {
    if (!data?.notams) return [];
    if (filter === 'all') return data.notams;
    return data.notams.filter(n => n.type === filter);
  }, [data, filter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="relative z-10 rounded-xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm p-5 flex flex-col"
      style={{ maxHeight: '400px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-cyan-400 tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          NOTAMs
        </h3>
        <span className="text-xs font-mono text-amber-400">
          {data?.count || 0} ACTIVE
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-3">
        {(['all', 'airport', 'area'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded transition-colors
              ${filter === f
                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                : 'text-gray-500 border border-transparent hover:border-cyan-500/30'
              }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* NOTAM List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {filteredNotams.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No NOTAMs found</p>
        ) : (
          filteredNotams.map((notam, idx) => (
            <motion.div
              key={notam.id}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded border p-3 cursor-pointer transition-colors
                ${notam.type === 'airport'
                  ? 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5'
                  : 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5'
                }
                ${expanded === notam.id ? 'ring-1 ring-cyan-400/50' : ''}`}
              onClick={() => setExpanded(expanded === notam.id ? null : notam.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-cyan-400">{notam.airport}</span>
                    <span className="text-xs text-gray-500">{notam.id}</span>
                  </div>
                  <p className={`text-sm ${expanded === notam.id ? '' : 'truncate'}`} style={{ maxWidth: '100%' }}>
                    {notam.text}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0
                    ${expanded === notam.id ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              {expanded === notam.id && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-cyan-500/20 text-xs text-gray-500"
                >
                  <p>Effective: {formatDate(notam.effective)}</p>
                  <p>Expires: {formatDate(notam.expires)}</p>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/30 p-5 animate-pulse">
      <div className="h-4 w-24 bg-cyan-500/20 rounded mb-4" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-16 bg-cyan-500/20 rounded" />
        <div className="h-6 w-16 bg-cyan-500/20 rounded" />
        <div className="h-6 w-16 bg-cyan-500/20 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-12 bg-cyan-500/10 rounded" />
        <div className="h-12 bg-cyan-500/10 rounded" />
        <div className="h-12 bg-cyan-500/10 rounded" />
      </div>
    </div>
  );
}
