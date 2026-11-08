import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import RoleBadge from './RoleBadge.jsx';
import api from '../services/api.js';

export default function Navbar() {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (e) {
      // silent fail
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = async (targetRole) => {
    setRoleSwitchDropdownOpen(false);
    try {
      await demoLogin(targetRole);
      // Navigate to respective dashboard
      if (targetRole === 'SUPER_ADMIN') navigate('/admin');
      else if (targetRole === 'MATCH_MASTER') navigate('/match-master');
      else if (targetRole === 'SCORE_MASTER') navigate('/score-master');
      else if (targetRole === 'TEAM_LEADER') navigate('/team');
      else navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SUPER_ADMIN': return '/admin';
      case 'MATCH_MASTER': return '/match-master';
      case 'SCORE_MASTER': return '/score-master';
      case 'TEAM_LEADER': return '/team';
      case 'PLAYER':
      default: return '/dashboard';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.45)]">
      <div className="h-20 w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin flex items-center justify-between gap-space-md">
        
        {/* Brand & Role View Selector */}
        <div className="flex items-center gap-space-md shrink-0">
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center p-1.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-full h-full">
                <rect width="40" height="40" rx="8" fill="#181818" />
                <path d="M12 10 L28 10 L22 20 L28 30 L12 30 L18 20 Z" fill="#F97316" />
                <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-wider leading-none uppercase font-bold group-hover:text-primary transition-colors">
                SCRIMS
              </span>
              <span className="font-label-caption text-label-caption text-primary tracking-widest uppercase mt-0.5">
                Book. Build. Own.
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-outline-variant/30 hidden lg:block"></div>

          {/* Quick Super Admin / Active Role Pill */}
          <div className="relative hidden lg:block">
            {user ? (
              <button
                onClick={() => navigate(getDashboardPath())}
                className="flex items-center gap-space-2xs px-space-sm py-1.5 rounded-lg bg-surface-container-low border border-primary/40 hover:border-primary text-on-surface transition-all text-left shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">admin_panel_settings</span>
                <span className="font-label-badge text-label-badge text-on-surface uppercase font-semibold">
                  {user.role.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-primary font-mono ml-1">● ACTIVE</span>
              </button>
            ) : (
              <button
                onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                className="flex items-center gap-space-2xs px-space-sm py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 text-on-surface-variant hover:text-on-surface transition-all text-left"
                type="button"
                title="1-Click Login as Super Admin (Kuldeep Gade)"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">shield_person</span>
                <span className="font-label-badge text-label-badge text-on-surface uppercase font-semibold">
                  SUPER ADMIN ACCESS
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden xl:flex items-center gap-space-md shrink-0">
          <Link
            to="/"
            className={`font-body-sm text-body-sm uppercase tracking-wider transition-colors ${
              location.pathname === '/' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Home
          </Link>
          <Link
            to="/tournaments"
            className={`font-body-sm text-body-sm uppercase tracking-wider transition-colors ${
              location.pathname === '/tournaments' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tournaments
          </Link>
          <Link
            to="/room"
            className={`font-body-sm text-body-sm uppercase tracking-wider transition-colors flex items-center gap-1 ${
              location.pathname.startsWith('/room') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Tournament Room
          </Link>
          <Link
            to="/leaderboard"
            className={`font-body-sm text-body-sm uppercase tracking-wider transition-colors ${
              location.pathname === '/leaderboard' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Leaderboard
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              className="px-3 py-1 rounded bg-primary-container/15 text-primary font-label-badge text-label-badge uppercase font-bold tracking-wider hover:bg-primary-container hover:text-on-primary transition-all"
            >
              Command Desk
            </Link>
          )}
        </nav>

        {/* Right Controls: Theme Toggle, Notifications, Profile, Mobile Menu */}
        <div className="flex items-center gap-space-sm shrink-0">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 text-on-surface-variant hover:text-primary transition-all flex items-center justify-center cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary/50 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary-container ring-2 ring-surface-container-lowest animate-pulse"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-surface-container border border-outline-variant/40 shadow-2xl p-space-md z-50 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between pb-space-2xs border-b border-outline-variant/20">
                    <span className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-primary text-[11px] font-label-badge uppercase hover:underline"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant py-4 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg text-left transition-colors flex flex-col gap-0.5 ${
                            n.is_read ? 'bg-surface-container-low opacity-75' : 'bg-surface-container-high border-l-2 border-primary'
                          }`}
                        >
                          <span className="font-headline-sm text-body-sm text-on-surface font-semibold">{n.title}</span>
                          <span className="text-body-sm text-on-surface-variant">{n.message}</span>
                          <span className="text-[10px] text-outline mt-1 font-label-caption">
                            {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Capsule / Login CTA */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-1 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant/80 transition-all cursor-pointer"
                type="button"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/40"
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-label-numeric text-label-numeric text-on-surface leading-tight font-semibold">
                    {user.username}
                  </span>
                  <span className="font-label-caption text-label-caption text-primary leading-none uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl bg-surface-container border border-outline-variant/40 shadow-2xl p-2 z-50 flex flex-col gap-1">
                  <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                    <span className="font-headline-sm text-body-sm text-on-surface font-bold block truncate">{user.full_name}</span>
                    <span className="text-body-sm text-on-surface-variant truncate block">{user.email}</span>
                    <span className="text-primary text-[10px] font-label-badge uppercase block mt-1">
                      Role: {user.role} {user.staff_code ? `(${user.staff_code})` : ''}
                    </span>
                    {user.mobile_number ? (
                      <span className="text-emerald-400 text-[11px] font-mono block mt-0.5">
                        📱 {user.mobile_number}
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px] block mt-0.5">
                        ⚠️ No Mobile Added
                      </span>
                    )}
                  </div>

                  {/* Profile Tab */}
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-high text-body-sm text-on-surface transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                    <span>Go to Profile</span>
                  </Link>

                  {/* Dashboard Tab */}
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-high text-body-sm text-on-surface transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span>
                    <span>My Dashboard Desk</span>
                  </Link>

                  {/* Sign Out Tab */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-error-container/30 text-body-sm text-error transition-colors w-full text-left font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-body-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface-variant hover:text-on-surface"
            aria-label="Toggle Navigation"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-b border-outline-variant/30 px-margin-mobile py-space-md flex flex-col gap-space-sm">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface font-headline-sm text-headline-sm uppercase"
          >
            Home
          </Link>
          <Link
            to="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface font-headline-sm text-headline-sm uppercase"
          >
            Tournaments Hub
          </Link>
          <Link
            to="/room"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-surface-container text-primary font-headline-sm text-headline-sm uppercase flex items-center justify-between"
          >
            <span>Tournament Room</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-label-badge">ARENA</span>
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface font-headline-sm text-headline-sm uppercase"
          >
            Leaderboard
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-surface-container text-primary font-headline-sm text-headline-sm uppercase flex items-center justify-between"
              >
                <span>Go to Profile</span>
                <span className="material-symbols-outlined text-[18px]">person</span>
              </Link>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm uppercase"
              >
                Command Desk ({user.role.replace('_', ' ')})
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
