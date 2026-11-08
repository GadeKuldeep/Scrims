import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile_number || '');
  const [inGameId, setInGameId] = useState(user?.in_game_id || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync state when user context changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setMobileNumber(user.mobile_number || '');
      setInGameId(user.in_game_id || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Full name cannot be blank.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to change your password.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        in_game_id: inGameId.trim(),
        avatar_url: avatarUrl.trim()
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await api.put('/auth/profile', payload);

      if (res.data?.success) {
        updateUserProfile(res.data.user);
        setSuccess('Profile updated successfully! All changes are now live.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        setError(res.data?.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-margin-mobile md:px-margin bg-background text-on-surface">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Link & Page Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Account & Roster Headquarters
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-on-surface">
              Manage Profile
            </h1>
          </div>

          <button
            onClick={() => navigate(-1)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs font-semibold uppercase text-on-surface-variant hover:text-on-surface transition-all border border-outline-variant/40"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Previous</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 rounded-xl bg-error/15 border border-error/40 text-error text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">check_circle</span>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Identity Overview Hero Card */}
        <div className="relative rounded-2xl bg-surface-container border border-outline-variant/40 p-6 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl || user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="Player Avatar"
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/40 shadow-md bg-surface-container-high"
              />
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-surface-container flex items-center justify-center text-[10px] text-white">
                ✓
              </span>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-on-surface">
                  {user?.full_name || 'Esports Player'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30">
                  {user?.role?.replace('_', ' ')}
                </span>
                {user?.staff_code && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-mono">
                    Code: {user.staff_code}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">mail</span>
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                  @{user?.username}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-emerald-400">verified</span>
                  Verified Platform Node
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-6">

          {/* SECTION 1: MOBILE NUMBER & CONTACT (HIGHLIGHTED FOR USER REQUEST) */}
          <div className="rounded-2xl bg-surface-container border border-primary/30 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-xl">contact_phone</span>
              <h3 className="text-base font-bold uppercase tracking-wide text-on-surface">
                Mobile & WhatsApp Verification
              </h3>
            </div>
            
            <p className="text-xs text-on-surface-variant mb-4">
              Add or update your mobile number to receive instant tournament slot verification, WhatsApp payment validation, and automated room ID/password delivery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Mobile Number (WhatsApp Enabled)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                    <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 919309381367 or +91 9309381367"
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {mobileNumber ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Mobile number configured for WhatsApp dispatch
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      No mobile number linked — add your number to receive room codes
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL IDENTITY & IN-GAME PROFILE */}
          <div className="rounded-2xl bg-surface-container border border-outline-variant/40 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-xl">sports_esports</span>
              <h3 className="text-base font-bold uppercase tracking-wide text-on-surface">
                Player Details & In-Game Persona
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your official name"
                  required
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              {/* In-Game ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  In-Game ID / Character ID (IGN)
                </label>
                <input
                  type="text"
                  value={inGameId}
                  onChange={(e) => setInGameId(e.target.value)}
                  placeholder="e.g. 5183920194 (BGMI/FF ID)"
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium"
                />
              </div>

              {/* Username (Read Only) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  SCRIMS Username
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full h-11 px-3.5 bg-surface-container-lowest/60 text-on-surface-variant text-sm rounded-xl border border-outline-variant/20 cursor-not-allowed font-medium"
                />
              </div>

              {/* Gmail / Email Address (Read Only) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Registered Gmail
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full h-11 px-3.5 bg-surface-container-lowest/60 text-on-surface-variant text-sm rounded-xl border border-outline-variant/20 cursor-not-allowed font-medium"
                />
              </div>

              {/* Avatar URL / Presets */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface placeholder:text-outline/60 text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium mb-2"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-on-surface-variant">Presets:</span>
                  <div className="flex items-center gap-2">
                    {presetAvatars.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                          avatarUrl === url ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SECURITY & PASSWORD CHANGE (COLLAPSIBLE) */}
          <div className="rounded-2xl bg-surface-container border border-outline-variant/40 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">lock_reset</span>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wide text-on-surface">
                    Security & Password
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Update your account access credentials
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs font-semibold uppercase text-on-surface transition-colors border border-outline-variant/40"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="mt-4 pt-4 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-11 px-3.5 bg-surface-container-low text-on-surface text-sm rounded-xl border border-outline-variant/40 focus:outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-bright text-xs font-bold uppercase tracking-wider text-on-surface transition-all border border-outline-variant/40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

