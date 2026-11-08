import React from 'react';

export default function SlotBadge({ status, className = '' }) {
  switch (status) {
    case 'AVAILABLE':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          AVAILABLE
        </span>
      );
    case 'HELD':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          HELD (10M)
        </span>
      );
    case 'BOOKED':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase tracking-wider bg-primary-container/20 text-primary border border-primary-container/40 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          BOOKED
        </span>
      );
    case 'LOCKED':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-label-badge uppercase tracking-wider bg-surface-container-high text-on-surface-variant border border-outline-variant/30 ${className}`}>
          LOCKED
        </span>
      );
  }
}
