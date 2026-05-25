'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ lastUpdated, isRefreshing, onRefresh }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 backdrop-blur-sm bg-black/30"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-2 border-cyan-400 flex items-center justify-center"
          >
            <div className="w-4 h-4 bg-cyan-400/50 rounded-full" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-cyan-400 tracking-wider">FLIGHT OPS</h1>
            <p className="text-xs text-amber-400/70 tracking-widest uppercase">Mission Control</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
          <p className="text-sm font-mono text-cyan-300">DENVER, CO</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Local Time</p>
          <LocalTimeDisplay />
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Last Update</p>
          <p className="text-sm font-mono text-amber-400/80">
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Next Refresh</p>
          <RefreshCountdown lastUpdated={lastUpdated} isRefreshing={isRefreshing} />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded border border-cyan-500/50 text-cyan-400 text-sm font-mono
            hover:bg-cyan-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${isRefreshing ? 'animate-pulse' : ''}`}
        >
          {isRefreshing ? 'REFRESHING...' : 'REFRESH'}
        </motion.button>
      </div>
    </motion.header>
  );
}

function LocalTimeDisplay() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const t = new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Denver',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTime(t);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <p className="text-sm font-mono text-cyan-300">{time}</p>;
}

function RefreshCountdown({ lastUpdated, isRefreshing }: { lastUpdated: Date | null; isRefreshing: boolean }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastUpdated || isRefreshing) {
        setTimeLeft(900);
        return;
      }
      
      const elapsed = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      const remaining = Math.max(0, 900 - elapsed);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, isRefreshing]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 60;

  return (
    <p className={`text-sm font-mono ${isWarning ? 'text-amber-400' : 'text-cyan-300/70'}`}>
      {isRefreshing ? 'NOW' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
    </p>
  );
}
