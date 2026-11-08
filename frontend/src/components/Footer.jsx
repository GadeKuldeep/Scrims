import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 pt-space-2xl pb-space-xl text-on-surface-variant">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin flex flex-col gap-space-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-xl">
          {/* Col 1 & 2: Brand & Fair Play Badge */}
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-full h-full">
                  <rect width="40" height="40" rx="8" fill="#181818" />
                  <path d="M12 10 L28 10 L22 20 L28 30 L12 30 L18 20 Z" fill="#F97316" />
                  <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
                </svg>
              </div>
              <span className="font-headline-sm text-headline-sm uppercase text-on-surface font-bold tracking-wider">
                SCRIMS
              </span>
            </div>
            <p className="font-body-md text-body-md max-w-sm">
              The premier precision-engineered esports tournament engine for BGMI, Free Fire, and Clash of Clans. Hourly competitive sessions verified by assigned Match Masters.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-label-badge text-label-badge text-on-surface uppercase">
                FAIR PLAY COMPLIANT • PURE TOUCH TELEMETRY
              </span>
            </div>
          </div>

          {/* Col 3: Competitive Games */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-badge text-label-badge text-on-surface uppercase tracking-wider font-bold">
              Tournament Circuits
            </span>
            <ul className="flex flex-col gap-2 text-body-sm">
              <li>
                <Link to="/tournaments?game=bgmi" className="hover:text-primary transition-colors">
                  BGMI Pro Series (16 Squads)
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=freefire" className="hover:text-primary transition-colors">
                  Free Fire MAX (12 Squads)
                </Link>
              </li>
              <li>
                <Link to="/tournaments?game=clashofclans" className="hover:text-primary transition-colors">
                  Clash Wars 1v1 (2 Teams)
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="hover:text-primary transition-colors">
                  Live 4-Map Leaderboards
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Operations & Match Schedule */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-badge text-label-badge text-on-surface uppercase tracking-wider font-bold">
              Operations & IST Clock
            </span>
            <p className="text-body-sm">
              Daily hourly brackets scheduled between:
              <strong className="block text-on-surface font-semibold mt-1">11:00 AM – 11:00 PM IST</strong>
            </p>
            <p className="text-body-sm">
              All payment verifications handled manually via WhatsApp with verified Match Masters.
            </p>
          </div>

          {/* Col 5: Platform Authority & Staff */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-badge text-label-badge text-on-surface uppercase tracking-wider font-bold">
              Staff Portal
            </span>
            <ul className="flex flex-col gap-2 text-body-sm">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Staff Authentication Node
                </Link>
              </li>
              <li>
                <Link to="/match-master" className="hover:text-primary transition-colors">
                  Match Master Desk
                </Link>
              </li>
              <li>
                <Link to="/score-master" className="hover:text-primary transition-colors">
                  Score Master Desk
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-primary transition-colors">
                  Super Admin Root
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-space-md border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm">
          <span className="font-label-caption text-label-caption uppercase tracking-wider">
            © 2026 SCRIMS ESPORTS PLATFORM. ALL RIGHTS RESERVED.
          </span>
          <div className="flex items-center gap-space-md font-label-caption text-label-caption uppercase">
            <span>Cluster: Asia-S1</span>
            <span>•</span>
            <span>Latency: 12ms</span>
            <span>•</span>
            <span className="text-primary font-semibold">Live Tournament Engine v2.4</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
