import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPortalPage() {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [tabMethod, setTabMethod] = useState('otp'); // 'otp' or 'credentials'
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('98765 43210');
  const [loginPassword, setLoginPassword] = useState('Password@123');
  const [otpDigits, setOtpDigits] = useState(['8', '4', '2', '', '', '']);

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regInGameId, setRegInGameId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('PLAYER');
  const [regTeamName, setRegTeamName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      let identifier = loginIdentifier.replace(/\s+/g, '');
      if (tabMethod === 'otp') {
        // Map OTP mobile to default test accounts or entered mobile
        if (identifier === '9876543210') identifier = 'vikram@scrims.gg';
        else if (identifier === '9876543211') identifier = 'igl@scrims.gg';
        else if (identifier === '9876543212') identifier = 'player@scrims.gg';
      }

      const user = await login(identifier, loginPassword);
      redirectAfterAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await register({
        full_name: regFullName,
        username: regUsername,
        email: regEmail,
        mobile_number: regMobile,
        in_game_id: regInGameId,
        password: regPassword,
        role: regRole,
        team_name: regTeamName
      });
      redirectAfterAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async (roleKey) => {
    setError('');
    setLoading(true);
    try {
      const user = await demoLogin(roleKey);
      redirectAfterAuth(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectAfterAuth = (user) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    switch (user.role) {
      case 'SUPER_ADMIN': navigate('/admin'); break;
      case 'MATCH_MASTER': navigate('/match-master'); break;
      case 'SCORE_MASTER': navigate('/score-master'); break;
      case 'TEAM_LEADER': navigate('/team'); break;
      case 'PLAYER':
      default: navigate('/dashboard'); break;
    }
  };

  return (
    <div className="w-full pt-20 bg-background flex-1 flex flex-col justify-center min-h-[calc(100vh-80px)]">
      {/* Staff & Executive SSO Banner Strip */}
      <div className="w-full bg-surface-container-lowest px-margin-mobile md:px-margin py-2.5 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-xs text-body-sm">
          <div className="flex items-center gap-2 text-on-surface-variant flex-wrap justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary-container/15 text-primary text-label-badge font-label-badge uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              Secure Auth Node
            </span>
            <span className="text-on-surface font-headline-sm text-body-sm uppercase tracking-wide">
              Official Esports Player & Staff Portal
            </span>
            <span className="hidden lg:inline text-outline-variant">•</span>
            <span className="hidden lg:inline text-outline text-body-sm">
              Role-based authorization enforced by Express API
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-[11px] font-label-caption uppercase tracking-wider hidden sm:inline">
              Instant 1-Click Demo Login:
            </span>
            <button
              onClick={() => handleDemoQuickLogin('MATCH_MASTER')}
              className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-bright text-primary text-[10px] font-label-badge uppercase tracking-wider transition-all"
            >
              Match Master
            </button>
            <button
              onClick={() => handleDemoQuickLogin('SCORE_MASTER')}
              className="px-2 py-0.5 rounded bg-surface-container-high hover:bg-surface-bright text-tertiary text-[10px] font-label-badge uppercase tracking-wider transition-all"
            >
              Score Master
            </button>
            <button
              onClick={() => handleDemoQuickLogin('SUPER_ADMIN')}
              className="px-2 py-0.5 rounded bg-error-container/40 hover:bg-error-container/60 text-error text-[10px] font-label-badge uppercase tracking-wider transition-all font-bold"
            >
              Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero Split Auth View */}
      <div className="relative w-full max-w-7xl mx-auto px-margin-mobile md:px-margin py-space-lg lg:py-space-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-start">
          
          {/* Left Column: Competitive Circuit Telemetry & Player Benefits */}
          <div className="lg:col-span-5 flex flex-col gap-space-md order-2 lg:order-1">
            
            {/* Live Scrim Countdown Capsule */}
            <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-xl border border-outline-variant/30">
              <div className="flex items-center justify-between gap-space-sm mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container"></span>
                  </span>
                  <span className="font-label-badge text-label-badge uppercase tracking-wider text-primary">
                    Live Match Desk Pulse
                  </span>
                </div>
                <span className="font-label-numeric text-body-sm text-on-surface-variant">Slot Server #04</span>
              </div>
              
              <div className="flex items-center justify-between bg-surface-container rounded-lg p-3">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-body-md text-on-surface uppercase tracking-wide">
                    BGMI Pro Series — Map 03 (Erangel)
                  </span>
                  <span className="font-label-numeric text-label-caption text-primary">
                    Dropping in <span className="text-on-surface font-bold">13m 48s</span> • 16/16 Teams Checked In
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-numeric text-label-badge">
                    T1 LOBBY
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Feature Telemetry Card */}
            <div className="rounded-xl bg-surface-container overflow-hidden shadow-xl flex flex-col border border-outline-variant/30">
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWT5Z1_aazZJVMhjuGLTSGxkBywHEBMvQvkNFNIcfmq5232ozqcpFzNYAiJZODccNOUAqEc5ie00Qnj8odfgwYLzMZg7CLyKUzogAy5PFKm0ucUKOcuVQ-zYne19KhPlJ0F_9FhbGGUAHwECGvJ6Tf9Ej3c_m_NvdPl0jDxaqkxZbPPeM7U-smTTKzrQXpxX2Hki7muQRwpuQZdXn7B9z2EZZGy0wdQLQEcECiU8E"
                  alt="Esports Arena Banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/70 to-transparent"></div>
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="font-label-badge text-label-badge tracking-widest text-primary uppercase block">
                      Official Platform
                    </span>
                    <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface leading-tight">
                      SCRIMS COMPETITIVE ENGINE
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-highest/90 text-on-surface text-label-caption font-label-numeric">
                    <span>PLAYER NODE</span>
                  </div>
                </div>
              </div>

              {/* Feature Breakdown */}
              <div className="p-space-md flex flex-col gap-space-sm">
                <span className="font-label-caption text-label-caption uppercase tracking-widest text-on-surface-variant">
                  Authenticated Squad Privileges
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container-high">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">key</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-sm text-on-surface">Auto-Sync Room ID & Password</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Receive official room credentials automatically once 16/16 squad slots are verified.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container-high">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-sm text-on-surface">Manual Payment Verification</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Every slot reservation is verified manually via WhatsApp by assigned Match Masters.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low transition-colors hover:bg-surface-container-high">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">touch_app</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-sm text-on-surface">Pure Touch Fair Play Standards</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Mobile handheld touch play with strict anti-macro and emulator prohibitions.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Form */}
          <div className="lg:col-span-7 flex flex-col gap-space-md order-1 lg:order-2">
            <div className="relative bg-surface-container rounded-xl p-space-md sm:p-space-xl shadow-2xl border border-outline-variant/30 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary-container to-primary-container"></div>

              {/* Form Header */}
              <div className="flex flex-col gap-1 mb-space-lg">
                <div className="flex items-center justify-between">
                  <span className="font-label-badge text-label-badge uppercase tracking-widest text-primary font-semibold">
                    SCRIMS COMPETITIVE GATEWAY
                  </span>
                  <span className="inline-flex items-center gap-1 text-label-caption font-label-numeric text-on-surface-variant uppercase bg-surface-container-high px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Node Online
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight uppercase mt-1">
                  {authMode === 'login' ? 'Player & Staff Sign In' : 'Roster Registration'}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {authMode === 'login'
                    ? 'Authorize your roster slot, inspect bracket seeds, and retrieve live room credentials.'
                    : 'Create a competitive SCRIMS profile or register a new team roster.'}
                </p>
              </div>

              {/* Mode Toggle: Sign In vs Roster Register */}
              <div className="flex p-1 rounded-lg bg-surface-container-low mb-space-md">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded text-label-numeric font-label-numeric uppercase text-center transition-all ${
                    authMode === 'login'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); }}
                  className={`flex-1 py-2 px-3 rounded text-label-numeric font-label-numeric uppercase text-center transition-all ${
                    authMode === 'register'
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Roster Enroll (Register)
                </button>
              </div>

              {error && (
                <div className="p-3 mb-space-md rounded-lg bg-error-container/30 border border-error/50 text-error text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* SIGN IN FORM */}
              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-space-md">
                  {/* Auth Method Tabs */}
                  <div className="flex p-1 rounded-lg bg-surface-container-low">
                    <button
                      type="button"
                      onClick={() => setTabMethod('otp')}
                      className={`flex-1 py-1.5 px-3 rounded text-[12px] font-label-numeric uppercase flex items-center justify-center gap-1.5 transition-all ${
                        tabMethod === 'otp'
                          ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">chat</span>
                      WhatsApp / Mobile OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabMethod('credentials')}
                      className={`flex-1 py-1.5 px-3 rounded text-[12px] font-label-numeric uppercase flex items-center justify-center gap-1.5 transition-all ${
                        tabMethod === 'credentials'
                          ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">key</span>
                      Email / In-Game ID & Password
                    </button>
                  </div>

                  {tabMethod === 'otp' ? (
                    <>
                      {/* Mobile Number Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-numeric text-label-numeric uppercase text-on-surface flex items-center justify-between">
                          <span>Captain WhatsApp / Mobile Number</span>
                          <span className="text-primary text-label-caption font-label-caption normal-case">
                            Manual WhatsApp Communication
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <div className="relative shrink-0 w-28">
                            <select className="w-full h-11 px-3 bg-surface-container-low text-on-surface font-label-numeric text-body-md rounded-lg border border-outline-variant/30 appearance-none cursor-pointer focus:outline-none focus:border-primary">
                              <option value="+91">+91 (IN)</option>
                              <option value="+880">+880 (BD)</option>
                              <option value="+977">+977 (NP)</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-on-surface-variant pointer-events-none">
                              expand_more
                            </span>
                          </div>
                          <input
                            type="tel"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            className="flex-1 h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline font-label-numeric text-body-md rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
                            placeholder="e.g. 98765 43210"
                            required
                          />
                        </div>
                      </div>

                      {/* 6-Digit Passcode Display Block */}
                      <div className="flex flex-col gap-2 bg-surface-container-low p-space-md rounded-lg border border-outline-variant/20">
                        <div className="flex items-center justify-between">
                          <span className="font-label-numeric text-label-caption uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[14px]">mark_chat_read</span>
                            Passcode Delivered via WhatsApp
                          </span>
                          <span className="font-label-numeric text-label-caption text-primary">00:45s</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2 sm:gap-3 my-1">
                          {otpDigits.map((d, idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength="1"
                              value={d}
                              onChange={(e) => {
                                const copy = [...otpDigits];
                                copy[idx] = e.target.value;
                                setOtpDigits(copy);
                              }}
                              className="h-12 text-center bg-surface-container text-on-surface font-label-numeric text-headline-sm rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary shadow-inner"
                              placeholder="•"
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Email / Username Input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-numeric text-label-numeric uppercase text-on-surface">
                          Email Address or Username
                        </label>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline font-label-numeric text-body-md rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
                          placeholder="e.g. player@scrims.gg or V01D_G4MER"
                          required
                        />
                      </div>

                      {/* Password Input */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-label-numeric text-label-numeric uppercase text-on-surface">
                            Password
                          </label>
                          <span className="text-primary text-label-caption cursor-pointer hover:underline">
                            Forgot?
                          </span>
                        </div>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline font-label-numeric text-body-md rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary"
                          placeholder="••••••••••••"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Anti-macro check */}
                  <label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-colors select-none border border-outline-variant/20">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-1 w-4 h-4 rounded accent-primary-container cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-body-sm text-on-surface font-semibold">
                        Confirm participation on mobile touch device (No emulators permitted)
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Strict fair-play hardware polling enforced by Super Admin council.
                      </span>
                    </div>
                  </label>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-headline-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Enter Tournament Hub & Lobby</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Full Name</label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Aditya Verma"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Username</label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. V01D_G4MER"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Email Address</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. igl@scrims.gg"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Mobile Number</label>
                      <input
                        type="tel"
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">In-Game Player UID</label>
                      <input
                        type="text"
                        value={regInGameId}
                        onChange={(e) => setRegInGameId(e.target.value)}
                        placeholder="e.g. 5149823419"
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Password</label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                  </div>

                  {/* Account Role Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-numeric text-[11px] uppercase text-on-surface">Roster Enrollment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('PLAYER')}
                        className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                          regRole === 'PLAYER'
                            ? 'bg-primary-container/15 border-primary text-on-surface'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                        }`}
                      >
                        <span className="font-headline-sm text-body-sm font-bold">Individual Player</span>
                        <span className="text-[11px]">Free agent, can be invited by team leaders</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('TEAM_LEADER')}
                        className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                          regRole === 'TEAM_LEADER'
                            ? 'bg-primary-container/15 border-primary text-on-surface'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                        }`}
                      >
                        <span className="font-headline-sm text-body-sm font-bold">Squad IGL / Leader</span>
                        <span className="text-[11px]">Create team, invite roster, submit bookings</span>
                      </button>
                    </div>
                  </div>

                  {regRole === 'TEAM_LEADER' && (
                    <div className="flex flex-col gap-1">
                      <label className="font-label-numeric text-[11px] uppercase text-on-surface">Squad / Team Name</label>
                      <input
                        type="text"
                        value={regTeamName}
                        onChange={(e) => setRegTeamName(e.target.value)}
                        placeholder="e.g. TEAM GODLIKE or REVENANT"
                        required
                        className="h-10 px-3 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/30 focus:border-primary text-body-sm"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-lg bg-primary-container hover:bg-secondary-container text-on-primary font-headline-sm text-headline-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Super Admin Quick Access Panel */}
              <div className="mt-space-lg pt-space-md border-t border-outline-variant/20 flex flex-col gap-2">
                <span className="font-label-caption text-label-caption text-on-surface-variant uppercase tracking-wider text-center">
                  Super Admin Management Portal
                </span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">shield_person</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-on-surface">Kuldeep Gade (Super Admin)</span>
                      <span className="text-[11px] text-on-surface-variant font-mono">gadekuldeep26@gmail.com • +91 9309381367</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDemoQuickLogin('SUPER_ADMIN')}
                    type="button"
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Instant Login</span>
                    <span className="material-symbols-outlined text-[14px]">login</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
