'use client';

import { motion } from 'framer-motion';

interface GoNoGoIndicatorProps {
  status: 'GO' | 'NO-GO' | 'CAUTION' | 'UNKNOWN';
  reasons: string[];
}

export default function GoNoGoIndicator({ status, reasons }: GoNoGoIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'GO': return 'text-emerald-400 border-emerald-400 bg-emerald-400/10 shadow-emerald-400/30';
      case 'NO-GO': return 'text-red-400 border-red-400 bg-red-400/10 shadow-red-400/30';
      case 'CAUTION': return 'text-amber-400 border-amber-400 bg-amber-400/10 shadow-amber-400/30';
      case 'UNKNOWN': return 'text-gray-400 border-gray-400 bg-gray-400/10 shadow-gray-400/30';
    }
  };

  const getGlowColor = () => {
    switch (status) {
      case 'GO': return '#34d399';
      case 'NO-GO': return '#f87171';
      case 'CAUTION': return '#fbbf24';
      case 'UNKNOWN': return '#9ca3af';
    }
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative z-10 rounded-xl border-2 p-6 ${getStatusColor()} shadow-lg`}
      style={{ boxShadow: `0 0 30px ${getGlowColor()}30` }}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <motion.div
            animate={status === 'UNKNOWN' ? {
              opacity: [0.5, 1, 0.5],
            } : {
              boxShadow: [
                `0 0 20px ${getGlowColor()}40`,
                `0 0 40px ${getGlowColor()}60`,
                `0 0 20px ${getGlowColor()}40`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center
              ${status === 'GO' ? 'border-emerald-400' : status === 'NO-GO' ? 'border-red-400' : status === 'CAUTION' ? 'border-amber-400' : 'border-gray-400'}
              bg-black/50`}
          >
            {status === 'GO' && (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'NO-GO' && (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'CAUTION' && (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {status === 'UNKNOWN' && (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            )}
          </motion.div>
          <div>
            <h2 className="text-4xl font-bold tracking-wider">{status}</h2>
            <p className="text-sm opacity-70 mt-1">
              {status === 'UNKNOWN' ? 'Waiting for data...' : 'Flight Status Decision'}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider opacity-70 mb-2">Decision Factors</p>
          <ul className="space-y-1">
            {reasons.map((reason, idx) => (
              <motion.li
                key={idx}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="text-sm flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full
                  ${status === 'GO' ? 'bg-emerald-400' : status === 'NO-GO' ? 'bg-red-400' : status === 'CAUTION' ? 'bg-amber-400' : 'bg-gray-400'}`}
                />
                {reason}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Animated corner accents */}
      <motion.div
        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2"
        style={{ borderColor: getGlowColor() }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2"
        style={{ borderColor: getGlowColor() }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
}
