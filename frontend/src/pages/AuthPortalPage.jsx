import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPortalPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMobile, setRegMobile] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirectAfterAuth = (user) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    switch (user?.role) {
      case 'SUPER_ADMIN':
        navigate('/admin');
        break;
      case 'MATCH_MASTER':
        navigate('/match-master');
        break;
      case 'SCORE_MASTER':
        navigate('/score-master');
        break;
      case 'TEAM_LEADER':
        navigate('/team');
        break;
      case 'PLAYER':
      default:
        navigate('/dashboard');
        break;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your Gmail address and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanEmail, password);
      redirectAfterAuth(user);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please provide your name, Gmail address, and a secure password.');
      return;
    }

    // Auto-generate username from email or name if blank
    const cleanUsername = regUsername.trim() || regEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || `player_${Date.now().toString().slice(-4)}`;

    setLoading(true);
    try {
      const user = await register({
        full_name: regFullName.trim(),
        username: cleanUsername,
        email: regEmail.trim(),
        password: regPassword,
        mobile_number: regMobile.trim() || '',
        role: 'PLAYER'
      });
      redirectAfterAuth(user);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed. Please check the details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('gadekuldeep26@gmail.com');
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] pt-20 pb-12 flex items-center justify-center px-4 bg-background">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        
        {/* Main Card */}
        <div className="relative rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-outline-variant/40 shadow-[0_12px_40px_rgba(0,0,0,0.55)] p-6 sm:p-8 overflow-hidden">
          
          {/* Top Decorative Brand Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/50 p-2.5 mb-3 shadow-lg shadow-black/40">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-full h-full">
                <rect width="40" height="40" rx="8" fill="#181818" />
                <path d="M12 10 L28 10 L22 20 L28 30 L12 30 L18 20 Z" fill="#F97316" />
                <circle cx="20" cy="20" r="3" fill="#FFFFFF" />
              </svg>
            </div>
            
            <h1 className="font-headline-sm text-2xl font-bold tracking-tight uppercase text-on-surface">
              {mode === 'login' ? 'Sign In to SCRIMS' : 'Create SCRIMS Account'}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {mode === 'login'
                ? 'Enter your Gmail & password to access tournaments'
                : 'Join competitive BGMI, Free Fire MAX & CoC circuits'}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low mb-6 border border-outline-variant/30">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error/15 border border-error/40 text-error text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">check_circle</span>
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          {/* ===================== SIGN IN FORM ===================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Gmail / Email Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    autoFocus
                    required
                    className="w-full h-11 pl-10 pr-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full h-11 pl-10 pr-10 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                    tabIndex="-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Quick Super Admin Fill Helper */}
              <div className="pt-3 border-t border-outline-variant/30 text-center">
                <button
                  type="button"
                  onClick={fillSuperAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs text-on-surface-variant hover:text-primary transition-all border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">shield_person</span>
                  <span>Super Admin Quick Fill</span>
                  <span className="text-[10px] text-primary font-mono ml-1">(Kuldeep Gade)</span>
                </button>
              </div>
            </form>
          )}

          {/* ===================== REGISTER FORM ===================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required
                    className="w-full h-10 pl-10 pr-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Gmail / Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Gmail / Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full h-10 pl-10 pr-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full h-10 pl-10 pr-10 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface"
                    tabIndex="-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mobile Number (Optional on register, can add in Profile) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    WhatsApp / Mobile Number
                  </label>
                  <span className="text-[10px] text-primary uppercase font-mono">Optional</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">phone</span>
                  </div>
                  <input
                    type="tel"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="e.g. 919309381367 (or add later in Profile)"
                    className="w-full h-10 pl-10 pr-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Note */}
          <div className="mt-6 text-center text-xs text-on-surface-variant">
            <span>Protected by SCRIMS Secure Auth Node • </span>
            <Link to="/" className="text-primary hover:underline font-semibold">
              Return to Hub
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
