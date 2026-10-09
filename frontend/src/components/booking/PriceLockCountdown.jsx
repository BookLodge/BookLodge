import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';

export const PriceLockCountdown = ({ expiresAt, onExpired }) => {
  const { formatted, isExpired, secondsLeft } = useCountdown(expiresAt, onExpired);

  const totalDuration = 10 * 60; // 10 minutes
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / totalDuration) * 100));

  if (isExpired) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-xs">
        <span className="font-bold">Rate Lock Expired:</span> Dynamic hotel rates change frequently. Please restart checkout to guarantee live availability and pricing.
      </div>
    );
  }

  const isLowTime = secondsLeft < 180; // under 3 minutes

  return (
    <div className={`rounded-xl border p-4 transition ${isLowTime ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-stone-50 border-stone-200 text-slate-800'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">
          {isLowTime ? 'Price Lock Expiring Soon' : 'Room & Rate Locked'}
        </span>
        <div className="font-mono text-sm font-bold tracking-wider" style={{ color: '#254546' }}>
          {formatted}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${progressPercent}%`, backgroundColor: isLowTime ? '#b45309' : '#254546' }}
        />
      </div>
    </div>
  );
};