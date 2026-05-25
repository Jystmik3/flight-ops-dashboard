'use client';

import { motion } from 'framer-motion';

interface TfrCardProps {
  data: {
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
  } | null;
  loading: boolean;
}

export default function TfrCard({ data, loading }: TfrCardProps) {
  if (loading) {
    return <CardSkeleton />;
  }

  const hasActiveTfr = data?.activeInArea;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`relative z-10 rounded-xl border p-5 backdrop-blur-sm
        ${hasActiveTfr
          ? 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/20'
          : 'border-cyan-500/30 bg-black/40'
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold tracking-wider flex items-center gap-2
          ${hasActiveTfr ? 'text-red-400' : 'text-cyan-400'}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          AIRSPACE / TFRs
        </h3>
        {hasActiveTfr ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-xs font-mono text-red-400 flex items-center gap-1"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            ACTIVE TFR
          </motion.span>
        ) : (
          <span className="text-xs font-mono text-emerald-400">CLEAR</span>
        )}
      </div>

      {hasActiveTfr && data?.tfrs && data.tfrs.length > 0 ? (
        <div className="space-y-3">
          {data.tfrs.map((tfr, idx) => (
            <motion.div
              key={tfr.id}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded border border-red-500/30 bg-black/30 p-3"
            >
              <p className="text-xs font-mono text-red-400 mb-1">{tfr.id}</p>
              <p className="text-sm text-gray-300">{tfr.text?.substring(0, 200)}{tfr.text?.length > 200 ? '...' : ''}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>Eff: {formatDate(tfr.effective)}</span>
                <span>Exp: {formatDate(tfr.expires)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <svg className="w-12 h-12 text-emerald-400/50 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <p className="text-emerald-400 font-medium">No Active TFRs</p>
          <p className="text-gray-500 text-sm mt-1">Denver metro airspace is clear</p>
        </div>
      )}

      {/* Status Summary */}
      <div className={`mt-4 pt-3 border-t ${hasActiveTfr ? 'border-red-500/30' : 'border-cyan-500/20'}`}>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Active TFRs in Area</span>
          <span className={`font-mono ${hasActiveTfr ? 'text-red-400' : 'text-emerald-400'}`}>
            {data?.count || 0}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
  } catch {
    return dateStr;
  }
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/30 p-5 animate-pulse">
      <div className="h-4 w-32 bg-cyan-500/20 rounded mb-4" />
      <div className="h-20 bg-cyan-500/10 rounded" />
    </div>
  );
}
