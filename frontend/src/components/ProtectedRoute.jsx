import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-space-md">
        <div className="w-10 h-10 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <span className="font-label-badge text-label-badge text-primary uppercase tracking-widest animate-pulse">
          AUTHENTICATING SCRIMS NODE...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their assigned role dashboard
    switch (user.role) {
      case 'SUPER_ADMIN':
        return <Navigate to="/admin" replace />;
      case 'MATCH_MASTER':
        return <Navigate to="/match-master" replace />;
      case 'SCORE_MASTER':
        return <Navigate to="/score-master" replace />;
      case 'TEAM_LEADER':
        return <Navigate to="/team" replace />;
      case 'PLAYER':
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
