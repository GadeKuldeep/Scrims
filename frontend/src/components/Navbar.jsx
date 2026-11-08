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
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

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
                onClick={() => setProfileDrawerOpen(true)}
                className="flex items-center gap-space-sm pl-space-xs pr-space-sm py-1 rounded-full bg-surface-container-low border border-outline-variant/40 hover:border-primary/60 transition-all cursor-pointer group"
                type="button"
                title="Open Profile Drawer"
              >
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-primary/40 group-hover:ring-primary transition-all"
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-label-numeric text-label-numeric text-on-surface leading-tight font-semibold group-hover:text-primary transition-colors">
                    {user.username}
                  </span>
                  <span className="font-label-caption text-label-caption text-primary leading-none uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">
                  menu_open
                </span>
              </button>
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
                className="px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary font-headline-sm text-headline-sm uppercase flex items-center justify-between"
              >
                <span>My Profile & Mobile</span>
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
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

      {/* Slide-Over Profile Drawer */}
      {isAuthenticated && profileDrawerOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setProfileDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm sm:max-w-md bg-surface-container border-l border-outline-variant/40 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Drawer Top Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">account_circle</span>
                    <span className="font-headline-sm text-sm uppercase tracking-wider font-bold text-on-surface">
                      Account & Profile
                    </span>
                  </div>
                  <button
                    onClick={() => setProfileDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    aria-label="Close Profile Drawer"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* User Identity Card */}
                <div className="mt-5 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-start gap-3.5">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={user.full_name || user.username}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline-sm text-base font-bold text-on-surface truncate">
                      {user.full_name || user.username}
                    </h3>
                    <p className="text-xs text-on-surface-variant truncate font-medium">
                      {user.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                        {user.role.replace('_', ' ')}
                      </span>
                      {user.in_game_id && (
                        <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-mono">
                          IGN: {user.in_game_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile / WhatsApp Status Banner */}
                <div className="mt-4 p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">phone_iphone</span>
                      WhatsApp / Mobile
                    </span>
                    {user.mobile_number ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/15 px-2 py-0.5 rounded">
                        LINKED
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/15 px-2 py-0.5 rounded">
                        NOT LINKED
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-on-surface">
                    {user.mobile_number || 'No mobile number added yet'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {user.mobile_number
                      ? 'Used for WhatsApp tournament verification & instant room password notifications.'
                      : 'Add your mobile in profile to receive match credentials on WhatsApp.'}
                  </p>
                </div>

                {/* Go to Profile Primary CTA Button */}
                <div className="mt-5">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDrawerOpen(false)}
                    className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>Go to Profile</span>
                  </Link>
                </div>

                {/* Quick Navigation Links */}
                <div className="mt-5 space-y-1 border-t border-outline-variant/20 pt-4">
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setProfileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high text-sm font-medium text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-[20px]">dashboard</span>
                    <span>Command Desk ({user.role.replace('_', ' ')})</span>
                  </Link>

                  <Link
                    to="/room"
                    onClick={() => setProfileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high text-sm font-medium text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-emerald-400 text-[20px]">sports_esports</span>
                    <span>Tournament Room & Arena</span>
                  </Link>

                  <Link
                    to="/tournaments"
                    onClick={() => setProfileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-high text-sm font-medium text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-tertiary text-[20px]">trophy</span>
                    <span>Browse Tournaments</span>
                  </Link>
                </div>
              </div>

              {/* Drawer Bottom: Sign Out */}
              <div className="pt-4 border-t border-outline-variant/30 mt-6">
                <button
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-error/15 hover:bg-error/25 text-error font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-error/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
