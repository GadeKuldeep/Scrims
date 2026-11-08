import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import TournamentHub from './pages/TournamentHub.jsx';
import AuthPortalPage from './pages/AuthPortalPage.jsx';
import SlotBookingPage from './pages/SlotBookingPage.jsx';
import TournamentRoomPage from './pages/TournamentRoomPage.jsx';
import PlayerDashboardPage from './pages/PlayerDashboardPage.jsx';
import TeamLeaderPage from './pages/TeamLeaderPage.jsx';
import MatchMasterDashboardPage from './pages/MatchMasterDashboardPage.jsx';
import ScoreMasterDashboardPage from './pages/ScoreMasterDashboardPage.jsx';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage.jsx';

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary mb-6">
        <span className="material-symbols-outlined text-4xl">sports_esports</span>
      </div>
      <h1 className="font-display-md text-headline-lg md:text-display-sm uppercase tracking-wider text-on-surface mb-3">
        404 — ARENA SECTOR NOT FOUND
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-8">
        The tactical match, tournament circuit, or administrative sector you requested does not exist or has concluded.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-badge font-bold uppercase tracking-wider hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
      >
        Return to Tournament Hub
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />
      
      <main className="flex-1 w-full">
        <Routes>
          {/* Public Tournament Circuits & Hub */}
          <Route path="/" element={<TournamentHub />} />
          <Route path="/tournaments" element={<TournamentHub />} />

          {/* Authentication & Onboarding Portal */}
          <Route path="/login" element={<AuthPortalPage />} />
          <Route path="/register" element={<AuthPortalPage />} />

          {/* Slot Reservation & Hold Flow */}
          <Route path="/book/:id" element={<SlotBookingPage />} />
          <Route path="/book" element={<Navigate to="/tournaments" replace />} />

          {/* Tournament Room (Credentials, Live Scoreboard & Chat) */}
          <Route path="/room/:id" element={<TournamentRoomPage />} />
          <Route path="/room" element={<TournamentRoomPage />} />
          <Route path="/leaderboard" element={<TournamentRoomPage />} />
          <Route path="/leaderboard/:id" element={<TournamentRoomPage />} />

          {/* Authenticated Player Portal */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PlayerDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Team Leader Management */}
          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRoles={['TEAM_LEADER', 'PLAYER', 'SUPER_ADMIN']}>
                <TeamLeaderPage />
              </ProtectedRoute>
            }
          />

          {/* Match Master Verification Desk */}
          <Route
            path="/match-master"
            element={
              <ProtectedRoute allowedRoles={['MATCH_MASTER', 'SUPER_ADMIN']}>
                <MatchMasterDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Score Master Telemetry Console */}
          <Route
            path="/score-master"
            element={
              <ProtectedRoute allowedRoles={['SCORE_MASTER', 'SUPER_ADMIN']}>
                <ScoreMasterDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
