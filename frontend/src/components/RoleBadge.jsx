import React from 'react';

export default function RoleBadge({ role, staffCode, className = '' }) {
  switch (role) {
    case 'SUPER_ADMIN':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container/40 text-error text-[11px] font-label-badge uppercase tracking-wider font-bold ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
          ROOT ADMIN
        </span>
      );
    case 'MATCH_MASTER':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container text-[11px] font-label-badge uppercase tracking-wider font-semibold ${className}`}>
          <span className="material-symbols-outlined text-[13px]">verified_user</span>
          MATCH MASTER {staffCode ? `• ${staffCode}` : ''}
        </span>
      );
    case 'SCORE_MASTER':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary text-[11px] font-label-badge uppercase tracking-wider font-semibold ${className}`}>
          <span className="material-symbols-outlined text-[13px]">fact_check</span>
          SCORE MASTER {staffCode ? `• ${staffCode}` : ''}
        </span>
      );
    case 'TEAM_LEADER':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-primary text-[11px] font-label-badge uppercase tracking-wider font-semibold ${className}`}>
          <span className="material-symbols-outlined text-[13px]">military_tech</span>
          SQUAD IGL
        </span>
      );
    case 'PLAYER':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[11px] font-label-badge uppercase tracking-wider ${className}`}>
          <span className="material-symbols-outlined text-[13px]">person</span>
          PLAYER
        </span>
      );
  }
}
